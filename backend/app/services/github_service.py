import os
import shutil
import tempfile
import re
import httpx
from pathlib import Path
from app.config import settings
from app.utils.logger import logger
from app.utils.security import validate_github_url


def _parse_github_url(url: str) -> tuple[str, str]:
    """Return (owner, repo) from a GitHub URL."""
    url = url.rstrip("/").replace(".git", "")
    match = re.search(r"github\.com/([^/]+)/([^/]+)", url)
    if not match:
        raise ValueError(f"Cannot parse GitHub URL: {url}")
    return match.group(1), match.group(2)


async def clone_github_repo(repo_url: str, target_dir: str) -> str:
    """Clone a GitHub repo using the Git API archive endpoint (no git binary required)."""
    if not validate_github_url(repo_url):
        raise ValueError("Invalid GitHub URL")

    owner, repo = _parse_github_url(repo_url)
    headers = {"Accept": "application/vnd.github.v3+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    # Resolve default branch
    default_branch = await _get_default_branch(owner, repo, headers)

    archive_url = f"https://api.github.com/repos/{owner}/{repo}/zipball/{default_branch}"
    logger.info("Downloading %s/%s (branch: %s)", owner, repo, default_branch)

    os.makedirs(target_dir, exist_ok=True)
    zip_path = os.path.join(target_dir, "repo.zip")

    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        async with client.stream("GET", archive_url, headers=headers) as resp:
            if resp.status_code == 404:
                raise ValueError(f"Repository {owner}/{repo} not found or is private")
            if resp.status_code == 403:
                raise ValueError("GitHub rate limit exceeded or private repo. Provide a GITHUB_TOKEN.")
            resp.raise_for_status()
            with open(zip_path, "wb") as f:
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    f.write(chunk)

    # Extract
    import zipfile
    extract_dir = os.path.join(target_dir, "extracted")
    os.makedirs(extract_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_dir)
    os.remove(zip_path)

    # GitHub archives contain a single top-level folder like "owner-repo-sha"
    entries = os.listdir(extract_dir)
    if len(entries) == 1 and os.path.isdir(os.path.join(extract_dir, entries[0])):
        return os.path.join(extract_dir, entries[0])
    return extract_dir


async def _get_default_branch(owner: str, repo: str, headers: dict) -> str:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                headers=headers,
            )
            if resp.status_code == 200:
                return resp.json().get("default_branch", "main")
    except Exception as exc:
        logger.warning("Could not fetch default branch: %s", exc)
    return "main"


async def get_repo_metadata(repo_url: str) -> dict:
    if not validate_github_url(repo_url):
        raise ValueError("Invalid GitHub URL")

    owner, repo = _parse_github_url(repo_url)
    headers = {"Accept": "application/vnd.github.v3+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=headers,
        )
        if resp.status_code == 404:
            raise ValueError(f"Repository {owner}/{repo} not found")
        resp.raise_for_status()
        data = resp.json()
        return {
            "name": data.get("name", repo),
            "full_name": data.get("full_name", f"{owner}/{repo}"),
            "description": data.get("description", ""),
            "language": data.get("language", ""),
            "stars": data.get("stargazers_count", 0),
            "default_branch": data.get("default_branch", "main"),
        }
