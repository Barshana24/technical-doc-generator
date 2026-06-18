from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.documentation import Project, GeneratedDocument
from app.services.export_service import generate_pdf, generate_docx
from app.utils.logger import logger

router = APIRouter(prefix="/export", tags=["export"])


def _get_project_docs(project_id: str, db: Session):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    docs = (
        db.query(GeneratedDocument)
        .filter_by(project_id=project_id)
        .order_by(GeneratedDocument.doc_type)
        .all()
    )
    if not docs:
        raise HTTPException(404, "No documents found for this project. Generate documentation first.")
    return project, docs


@router.get("/project/{project_id}/pdf")
def export_project_pdf(project_id: str, db: Session = Depends(get_db)):
    project, docs = _get_project_docs(project_id, db)
    try:
        pdf_bytes = generate_pdf(project, docs)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))
    except Exception as exc:
        logger.error("PDF export failed for project %s: %s", project_id, exc)
        raise HTTPException(500, "PDF generation failed")

    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in project.name)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_docs.pdf"'},
    )


@router.get("/project/{project_id}/docx")
def export_project_docx(project_id: str, db: Session = Depends(get_db)):
    project, docs = _get_project_docs(project_id, db)
    try:
        docx_bytes = generate_docx(project, docs)
    except RuntimeError as exc:
        raise HTTPException(500, str(exc))
    except Exception as exc:
        logger.error("DOCX export failed for project %s: %s", project_id, exc)
        raise HTTPException(500, "DOCX generation failed")

    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in project.name)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_docs.docx"'},
    )


@router.get("/document/{doc_id}/pdf")
def export_single_doc_pdf(doc_id: str, db: Session = Depends(get_db)):
    doc = db.get(GeneratedDocument, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    project = db.get(Project, doc.project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    try:
        pdf_bytes = generate_pdf(project, [doc])
    except Exception as exc:
        logger.error("PDF export failed: %s", exc)
        raise HTTPException(500, "PDF generation failed")

    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in doc.title)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.pdf"'},
    )


@router.get("/document/{doc_id}/docx")
def export_single_doc_docx(doc_id: str, db: Session = Depends(get_db)):
    doc = db.get(GeneratedDocument, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    project = db.get(Project, doc.project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    try:
        docx_bytes = generate_docx(project, [doc])
    except Exception as exc:
        logger.error("DOCX export failed: %s", exc)
        raise HTTPException(500, "DOCX generation failed")

    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in doc.title)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.docx"'},
    )
