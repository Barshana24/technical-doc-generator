import os
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.documentation import (
    Project, DocumentationJob, GeneratedDocument, JobStatus, DocType
)
from app.services.ollama_service import OllamaService
from app.services.code_analyzer import CodeAnalyzer, CodeStructure
from app.utils.file_utils import collect_code_files, get_language_stats
from app.utils.logger import logger


class DocumentationGenerator:
    def __init__(self, db: Session, ollama: OllamaService, analyzer: CodeAnalyzer):
        self.db = db
        self.ollama = ollama
        self.analyzer = analyzer

    async def run_job(self, job_id: str) -> None:
        job = self.db.get(DocumentationJob, job_id)
        if not job:
            logger.error("Job %s not found", job_id)
            return

        job.status = JobStatus.processing
        self.db.commit()

        try:
            project = self.db.get(Project, job.project_id)
            if not project:
                raise ValueError(f"Project {job.project_id} not found")

            source_dir = project.source_path
            files = collect_code_files(source_dir)
            if not files:
                raise ValueError("No supported code files found in project")

            project.file_count = len(files)
            project.language_stats = get_language_stats(files)
            self.db.commit()

            structures: List[CodeStructure] = []
            for f in files:
                s = self.analyzer.analyze(f["path"], f["content"], f["language"])
                structures.append(s)

            doc_types = job.doc_types or []
            generated_docs = []

            if DocType.readme in doc_types or DocType.full in doc_types:
                doc = await self._gen_readme(job, project, structures)
                if doc:
                    generated_docs.append(doc)

            if DocType.api in doc_types or DocType.full in doc_types:
                doc = await self._gen_api_docs(job, project, structures)
                if doc:
                    generated_docs.append(doc)

            if DocType.functions in doc_types or DocType.full in doc_types:
                doc = await self._gen_function_docs(job, project, structures)
                if doc:
                    generated_docs.append(doc)

            if DocType.classes in doc_types or DocType.full in doc_types:
                doc = await self._gen_class_docs(job, project, structures)
                if doc:
                    generated_docs.append(doc)

            if DocType.uml in doc_types or DocType.full in doc_types:
                doc = await self._gen_uml(job, project, structures)
                if doc:
                    generated_docs.append(doc)

            if DocType.inline in doc_types:
                doc = await self._gen_inline_comments(job, project, structures)
                if doc:
                    generated_docs.append(doc)

            for doc in generated_docs:
                self.db.add(doc)

            job.status = JobStatus.completed
            job.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            logger.info("Job %s completed — %d documents generated", job_id, len(generated_docs))

        except Exception as exc:
            logger.error("Job %s failed: %s", job_id, exc, exc_info=True)
            job.status = JobStatus.failed
            job.error_message = str(exc)
            self.db.commit()

    async def _gen_readme(
        self, job: DocumentationJob, project: Project, structures: List[CodeStructure]
    ) -> Optional[GeneratedDocument]:
        try:
            summary = self.analyzer.build_summary_text(structures)
            content = await self.ollama.generate_readme(
                project.name,
                summary,
                project.language_stats or {},
            )
            return GeneratedDocument(
                project_id=project.id,
                job_id=job.id,
                doc_type=DocType.readme,
                title=f"README — {project.name}",
                content=content,
            )
        except Exception as exc:
            logger.error("README generation failed: %s", exc)
            return None

    async def _gen_api_docs(
        self, job: DocumentationJob, project: Project, structures: List[CodeStructure]
    ) -> Optional[GeneratedDocument]:
        endpoints_text = self.analyzer.build_endpoints_text(structures)
        if not endpoints_text.strip():
            return None
        try:
            content = await self.ollama.generate_api_docs(endpoints_text)
            return GeneratedDocument(
                project_id=project.id,
                job_id=job.id,
                doc_type=DocType.api,
                title=f"API Reference — {project.name}",
                content=content,
            )
        except Exception as exc:
            logger.error("API docs generation failed: %s", exc)
            return None

    async def _gen_function_docs(
        self, job: DocumentationJob, project: Project, structures: List[CodeStructure]
    ) -> Optional[GeneratedDocument]:
        functions_text = self.analyzer.build_functions_text(structures)
        if not functions_text.strip():
            return None
        primary_lang = "code"
        if project.language_stats:
            primary_lang = next(iter(project.language_stats), "code")
        try:
            content = await self.ollama.generate_function_docs(functions_text, primary_lang)
            return GeneratedDocument(
                project_id=project.id,
                job_id=job.id,
                doc_type=DocType.functions,
                title=f"Function Documentation — {project.name}",
                content=content,
            )
        except Exception as exc:
            logger.error("Function docs generation failed: %s", exc)
            return None

    async def _gen_class_docs(
        self, job: DocumentationJob, project: Project, structures: List[CodeStructure]
    ) -> Optional[GeneratedDocument]:
        classes_text = self.analyzer.build_classes_text(structures)
        if not classes_text.strip():
            return None
        primary_lang = "code"
        if project.language_stats:
            primary_lang = next(iter(project.language_stats), "code")
        try:
            content = await self.ollama.generate_class_docs(classes_text, primary_lang)
            return GeneratedDocument(
                project_id=project.id,
                job_id=job.id,
                doc_type=DocType.classes,
                title=f"Class Documentation — {project.name}",
                content=content,
            )
        except Exception as exc:
            logger.error("Class docs generation failed: %s", exc)
            return None

    async def _gen_uml(
        self, job: DocumentationJob, project: Project, structures: List[CodeStructure]
    ) -> Optional[GeneratedDocument]:
        classes_text = self.analyzer.build_classes_text(structures)
        if not classes_text.strip():
            return None
        try:
            mermaid_code = await self.ollama.generate_uml_mermaid(classes_text)
            summary = self.analyzer.build_summary_text(structures)
            content = f"# UML Class Diagram — {project.name}\n\nGenerated from {project.file_count} source files.\n\n"
            content += f"## Classes Overview\n\n{classes_text[:1000]}\n\n"
            content += "## Mermaid Diagram\n\nRender the diagram below with any Mermaid-compatible viewer.\n"
            return GeneratedDocument(
                project_id=project.id,
                job_id=job.id,
                doc_type=DocType.uml,
                title=f"UML Diagram — {project.name}",
                content=content,
                mermaid_diagram=mermaid_code,
            )
        except Exception as exc:
            logger.error("UML generation failed: %s", exc)
            return None

    async def _gen_inline_comments(
        self, job: DocumentationJob, project: Project, structures: List[CodeStructure]
    ) -> Optional[GeneratedDocument]:
        all_comments = []
        for s in structures[:5]:  # cap at 5 files to avoid timeouts
            if not s.raw_content.strip():
                continue
            try:
                commented = await self.ollama.generate_inline_comments(
                    s.raw_content[:2000], s.language
                )
                all_comments.append(f"## File: `{s.file_path}`\n\n```{s.language}\n{commented}\n```\n")
            except Exception as exc:
                logger.warning("Inline comment generation failed for %s: %s", s.file_path, exc)

        if not all_comments:
            return None

        content = f"# Inline Comments — {project.name}\n\n" + "\n".join(all_comments)
        return GeneratedDocument(
            project_id=project.id,
            job_id=job.id,
            doc_type=DocType.inline,
            title=f"Inline Comments — {project.name}",
            content=content,
        )
