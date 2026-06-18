import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.documentation import Project, SourceType
from app.services.github_service import clone_github_repo, get_repo_metadata
from app.utils.file_utils import extract_zip
from app.utils.security import validate_file_size, is_allowed_extension, validate_github_url
from app.config import settings
from app.utils.logger import logger

router = APIRouter(prefix="/upload", tags=["upload"])


def _make_project_dir(project_id: str) -> str:
    path = os.path.abspath(os.path.join(settings.UPLOAD_DIR, project_id))
    os.makedirs(path, exist_ok=True)
    return path


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not is_allowed_extension(file.filename or ""):
        raise HTTPException(400, f"File type not supported: {file.filename}")

    content = await file.read()
    if not validate_file_size(len(content)):
        raise HTTPException(413, "File exceeds maximum allowed size (50 MB)")

    project_id = str(uuid.uuid4())
    project_dir = _make_project_dir(project_id)
    dest_path = os.path.join(project_dir, os.path.basename(file.filename or "file.txt"))

    with open(dest_path, "wb") as f:
        f.write(content)

    project = Project(
        id=project_id,
        name=os.path.splitext(os.path.basename(file.filename or "file"))[0],
        source_type=SourceType.file,
        source_path=project_dir,
        file_count=1,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info("File uploaded: %s -> project %s", file.filename, project_id)
    return {"project_id": project.id, "name": project.name, "file_count": 1}


@router.post("/zip")
async def upload_zip(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    filename = file.filename or "archive.zip"
    if not filename.lower().endswith(".zip"):
        raise HTTPException(400, "Only ZIP archives are supported")

    content = await file.read()
    if not validate_file_size(len(content)):
        raise HTTPException(413, "ZIP file exceeds maximum allowed size (50 MB)")

    project_id = str(uuid.uuid4())
    project_dir = _make_project_dir(project_id)
    zip_path = os.path.join(project_dir, "upload.zip")

    with open(zip_path, "wb") as f:
        f.write(content)

    extract_dir = os.path.join(project_dir, "source")
    try:
        extract_zip(zip_path, extract_dir)
    except Exception as exc:
        shutil.rmtree(project_dir, ignore_errors=True)
        raise HTTPException(400, f"Failed to extract ZIP: {exc}")
    finally:
        if os.path.exists(zip_path):
            os.remove(zip_path)

    project_name = os.path.splitext(filename)[0]
    project = Project(
        id=project_id,
        name=project_name,
        source_type=SourceType.zip,
        source_path=extract_dir,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info("ZIP uploaded: %s -> project %s", filename, project_id)
    return {"project_id": project.id, "name": project.name}


class GitHubImportRequest(BaseModel):
    url: str


@router.post("/github")
async def import_github(
    body: GitHubImportRequest,
    db: Session = Depends(get_db),
):
    if not validate_github_url(body.url):
        raise HTTPException(400, "Invalid GitHub repository URL")

    project_id = str(uuid.uuid4())
    project_dir = _make_project_dir(project_id)

    try:
        metadata = await get_repo_metadata(body.url)
        source_path = await clone_github_repo(body.url, project_dir)
    except ValueError as exc:
        shutil.rmtree(project_dir, ignore_errors=True)
        raise HTTPException(400, str(exc))
    except Exception as exc:
        shutil.rmtree(project_dir, ignore_errors=True)
        logger.error("GitHub import failed: %s", exc)
        raise HTTPException(500, f"Failed to import repository: {exc}")

    project = Project(
        id=project_id,
        name=metadata.get("name", "github-repo"),
        source_type=SourceType.github,
        source_path=source_path,
        github_url=body.url,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    logger.info("GitHub repo imported: %s -> project %s", body.url, project_id)
    return {
        "project_id": project.id,
        "name": project.name,
        "github_metadata": metadata,
    }
