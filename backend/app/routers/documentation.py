import asyncio
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.documentation import (
    Project, DocumentationJob, GeneratedDocument, JobStatus, DocType
)
from app.services.ollama_service import ollama_service
from app.services.code_analyzer import code_analyzer
from app.services.documentation_generator import DocumentationGenerator
from app.utils.logger import logger

router = APIRouter(prefix="/documentation", tags=["documentation"])


class GenerateRequest(BaseModel):
    project_id: str
    doc_types: List[str] = ["full"]


class JobResponse(BaseModel):
    job_id: str
    project_id: str
    status: str
    doc_types: List[str]
    created_at: Optional[str]
    completed_at: Optional[str]
    error_message: Optional[str]
    document_count: int = 0


class DocumentResponse(BaseModel):
    id: str
    project_id: str
    job_id: str
    doc_type: str
    title: str
    content: str
    mermaid_diagram: Optional[str]
    created_at: Optional[str]


async def _run_job_bg(job_id: str, db_session: Session) -> None:
    generator = DocumentationGenerator(db_session, ollama_service, code_analyzer)
    await generator.run_job(job_id)


def _start_job(job_id: str, db: Session) -> None:
    """Fire-and-forget the generation job using asyncio."""
    loop = asyncio.get_event_loop()
    loop.create_task(_run_job_bg(job_id, db))


@router.post("/generate", response_model=JobResponse)
async def generate_documentation(
    body: GenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    project = db.get(Project, body.project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    valid_types = {dt.value for dt in DocType}
    doc_types = []
    for dt in body.doc_types:
        if dt not in valid_types:
            raise HTTPException(400, f"Invalid doc_type: {dt}. Valid: {list(valid_types)}")
        doc_types.append(dt)

    job = DocumentationJob(
        project_id=project.id,
        doc_types=doc_types,
        status=JobStatus.pending,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    async def bg(job_id: str) -> None:
        from app.database import SessionLocal
        bg_db = SessionLocal()
        try:
            generator = DocumentationGenerator(bg_db, ollama_service, code_analyzer)
            await generator.run_job(job_id)
        finally:
            bg_db.close()

    background_tasks.add_task(bg, job.id)
    logger.info("Documentation job %s queued for project %s", job.id, project.id)

    return JobResponse(
        job_id=job.id,
        project_id=job.project_id,
        status=job.status.value,
        doc_types=job.doc_types,
        created_at=job.created_at.isoformat() if job.created_at else None,
        completed_at=None,
        error_message=None,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.get(DocumentationJob, job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    doc_count = db.query(GeneratedDocument).filter_by(job_id=job_id).count()
    return JobResponse(
        job_id=job.id,
        project_id=job.project_id,
        status=job.status.value,
        doc_types=job.doc_types,
        created_at=job.created_at.isoformat() if job.created_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        error_message=job.error_message,
        document_count=doc_count,
    )


@router.get("/projects/{project_id}/documents", response_model=List[DocumentResponse])
def list_documents(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    docs = (
        db.query(GeneratedDocument)
        .filter_by(project_id=project_id)
        .order_by(GeneratedDocument.created_at.desc())
        .all()
    )
    return [
        DocumentResponse(
            id=d.id,
            project_id=d.project_id,
            job_id=d.job_id,
            doc_type=d.doc_type.value,
            title=d.title,
            content=d.content,
            mermaid_diagram=d.mermaid_diagram,
            created_at=d.created_at.isoformat() if d.created_at else None,
        )
        for d in docs
    ]


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.get(GeneratedDocument, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return DocumentResponse(
        id=doc.id,
        project_id=doc.project_id,
        job_id=doc.job_id,
        doc_type=doc.doc_type.value,
        title=doc.title,
        content=doc.content,
        mermaid_diagram=doc.mermaid_diagram,
        created_at=doc.created_at.isoformat() if doc.created_at else None,
    )


@router.delete("/documents/{doc_id}", status_code=204)
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.get(GeneratedDocument, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    db.delete(doc)
    db.commit()


@router.get("/projects", response_model=List[dict])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "source_type": p.source_type.value,
            "github_url": p.github_url,
            "language_stats": p.language_stats,
            "file_count": p.file_count,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    import shutil
    if project.source_path and os.path.exists(project.source_path):
        parent = os.path.dirname(project.source_path)
        shutil.rmtree(parent, ignore_errors=True)

    db.delete(project)
    db.commit()
