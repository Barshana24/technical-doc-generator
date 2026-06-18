import os
import shutil
import zipfile
import chardet
from pathlib import Path
from typing import Dict, List, Tuple
from app.config import settings
from app.utils.security import is_allowed_extension, is_dangerous_file, sanitize_filename
from app.utils.logger import logger


def read_file_content(file_path: str) -> str:
    with open(file_path, "rb") as f:
        raw = f.read()
    detected = chardet.detect(raw)
    encoding = detected.get("encoding") or "utf-8"
    try:
        return raw.decode(encoding, errors="replace")
    except (LookupError, UnicodeDecodeError):
        return raw.decode("utf-8", errors="replace")


def get_language_from_extension(ext: str) -> str:
    mapping = {
        ".py": "python", ".js": "javascript", ".ts": "typescript",
        ".jsx": "javascript", ".tsx": "typescript", ".java": "java",
        ".cpp": "cpp", ".c": "c", ".h": "c", ".cs": "csharp",
        ".go": "go", ".rs": "rust", ".php": "php", ".rb": "ruby",
        ".swift": "swift", ".kt": "kotlin", ".scala": "scala",
        ".r": "r", ".m": "matlab", ".sh": "bash", ".yaml": "yaml",
        ".yml": "yaml", ".json": "json", ".xml": "xml", ".html": "html",
        ".css": "css", ".scss": "scss", ".sass": "sass", ".sql": "sql",
        ".md": "markdown", ".vue": "vue", ".dart": "dart",
    }
    return mapping.get(ext.lower(), "text")


def collect_code_files(directory: str) -> List[Dict]:
    files = []
    skip_dirs = {".git", "__pycache__", "node_modules", ".venv", "venv",
                 "dist", "build", ".next", ".nuxt", "vendor", "target"}

    for root, dirs, filenames in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for filename in filenames:
            if not is_allowed_extension(filename):
                continue
            if is_dangerous_file(filename):
                continue
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, directory)
            ext = Path(filename).suffix.lower()
            try:
                stat = os.stat(full_path)
                if stat.st_size > 1_000_000:  # skip files > 1 MB
                    logger.warning("Skipping large file: %s", rel_path)
                    continue
                content = read_file_content(full_path)
                files.append({
                    "path": rel_path,
                    "filename": filename,
                    "extension": ext,
                    "language": get_language_from_extension(ext),
                    "content": content,
                    "size": stat.st_size,
                })
            except Exception as exc:
                logger.warning("Could not read %s: %s", full_path, exc)
    return files


def extract_zip(zip_path: str, target_dir: str) -> str:
    os.makedirs(target_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            safe_name = sanitize_filename(member.filename)
            if not safe_name or safe_name.startswith(".."):
                continue
            dest = os.path.join(target_dir, member.filename)
            if not os.path.abspath(dest).startswith(os.path.abspath(target_dir)):
                continue
            zf.extract(member, target_dir)
    return target_dir


def get_language_stats(files: List[Dict]) -> Dict[str, int]:
    stats: Dict[str, int] = {}
    for f in files:
        lang = f["language"]
        stats[lang] = stats.get(lang, 0) + 1
    return dict(sorted(stats.items(), key=lambda x: x[1], reverse=True))


def cleanup_directory(path: str) -> None:
    try:
        shutil.rmtree(path, ignore_errors=True)
    except Exception as exc:
        logger.warning("Cleanup failed for %s: %s", path, exc)
