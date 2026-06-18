from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum


def _uuid() -> str:
    return str(uuid.uuid4())


class SourceType(str, enum.Enum):
    file = "file"
    zip = "zip"
    github = "github"


class JobStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class DocType(str, enum.Enum):
    readme = "readme"
    api = "api"
    functions = "functions"
    classes = "classes"
    inline = "inline"
    uml = "uml"
    full = "full"


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    source_type = Column(Enum(SourceType), nullable=False)
    source_path = Column(String(1024), nullable=True)
    github_url = Column(String(1024), nullable=True)
    language_stats = Column(JSON, nullable=True)
    file_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    jobs = relationship("DocumentationJob", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("GeneratedDocument", back_populates="project", cascade="all, delete-orphan")


class DocumentationJob(Base):
    __tablename__ = "documentation_jobs"

    id = Column(String(36), primary_key=True, default=_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    doc_types = Column(JSON, nullable=False)  # list of DocType strings
    status = Column(Enum(JobStatus), default=JobStatus.pending, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="jobs")
    documents = relationship("GeneratedDocument", back_populates="job", cascade="all, delete-orphan")


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(String(36), primary_key=True, default=_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("documentation_jobs.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(Enum(DocType), nullable=False)
    title = Column(String(512), nullable=False)
    content = Column(Text, nullable=False)
    mermaid_diagram = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="documents")
    job = relationship("DocumentationJob", back_populates="documents")
