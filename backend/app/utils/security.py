import os
import re
from pathlib import Path
from app.config import settings
from app.utils.logger import logger


_TRAVERSAL_RE = re.compile(r"\.\.[/\\]")
_DANGEROUS_EXTENSIONS = {".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".dll", ".so"}


def sanitize_filename(filename: str) -> str:
    name = os.path.basename(filename)
    name = re.sub(r"[^\w.\-]", "_", name)
    return name[:255]


def is_safe_path(base_dir: str, path: str) -> bool:
    try:
        resolved = Path(base_dir).resolve() / Path(path).name
        return str(resolved).startswith(str(Path(base_dir).resolve()))
    except Exception:
        return False


def is_allowed_extension(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in settings.ALLOWED_CODE_EXTENSIONS


def is_dangerous_file(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in _DANGEROUS_EXTENSIONS


def validate_github_url(url: str) -> bool:
    pattern = re.compile(
        r"^https?://github\.com/[A-Za-z0-9_.\-]+/[A-Za-z0-9_.\-]+(\.git)?(/.*)?$"
    )
    return bool(pattern.match(url))


def validate_file_size(size: int) -> bool:
    return size <= settings.MAX_FILE_SIZE
