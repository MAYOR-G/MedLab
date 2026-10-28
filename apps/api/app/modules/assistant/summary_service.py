"""Summary generation service for medical documents."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.db.models import (
    AISummary,
    DocumentExtraction,
    DocumentVersion,
    MedicalDocument,
)
from app.integrations.medical_sources.citations import get_relevant_citations
from app.integrations.openrouter.client import openrouter_client
from app.modules.assistant.prompts import PROMPT_VERSION, SUMMARY_SYSTEM_PROMPT
from app.modules.assistant.schemas import AISummaryData
from app.services.audit_service import record_audit_event


def _to_summary_data(summary: AISummary) -> AISummaryData:
    citations = (
        summary.source_reference_metadata.get("citations", [])
        if summary.source_reference_metadata
        else []
    )
    return AISummaryData(
        id=summary.id,
        documentVersionId=summary.document_version_id,
        status=summary.status,
        summaryText=summary.summary_text,
        provider=summary.provider,
        model=summary.model,
        promptVersion=summary.prompt_version,
        citations=citations,
        createdAt=summary.created_at,
        updatedAt=summary.updated_at,
    )


def generate_document_summary(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    request_id: str | None = None,
) -> AISummaryData:
    """Generate or retrieve AI plain-English summary for a document's active version."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    version = db.scalar(
        select(DocumentVersion).where(
            DocumentVersion.document_id == doc.id,
            DocumentVersion.is_current.is_(True),
        )
    )
    if not version:
        raise NotFoundError("No active uploaded version found for this document.")

    # Check for existing completed summary
    existing_summary = db.scalar(
        select(AISummary).where(
            AISummary.document_version_id == version.id,
            AISummary.status == "succeeded",
        )
    )
    if existing_summary:
        return _to_summary_data(existing_summary)

    # Fetch extraction text
    extraction = db.scalar(
        select(DocumentExtraction).where(
            DocumentExtraction.document_version_id == version.id
        )
    )
    extracted_text = (
        extraction.extracted_text
        if (extraction and extraction.extracted_text)
        else (
            f"Medical Record: {doc.title}\nCategory: {doc.category}\nDate: {doc.document_date or 'Recent'}\nNotes: {doc.notes or 'None'}"
        )
    )

    citations = get_relevant_citations(extracted_text)

    # Invoke OpenRouter
    user_prompt = f"Document Title: {doc.title}\nCategory: {doc.category}\nExtracted Content:\n{extracted_text}"
    summary_text, model_used = openrouter_client.generate_chat_completion(
        system_prompt=SUMMARY_SYSTEM_PROMPT,
        user_message=user_prompt,
    )

    now = datetime.now(UTC)
    summary = AISummary(
        id=uuid.uuid4(),
        document_version_id=version.id,
        status="succeeded",
        summary_text=summary_text,
        provider="openrouter",
        model=model_used,
        prompt_version=PROMPT_VERSION,
        source_reference_metadata={"citations": citations},
        created_at=now,
        updated_at=now,
    )
    db.add(summary)
    db.flush()

    record_audit_event(
        db,
        action="AI_SUMMARY_GENERATED",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=doc.id,
        request_id=request_id,
        metadata={"summary_id": str(summary.id), "model": model_used},
    )

    return _to_summary_data(summary)


def list_document_summaries(
    db: Session,
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
) -> list[AISummaryData]:
    """List all AI summaries for a document's versions."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    versions_subquery = select(DocumentVersion.id).where(
        DocumentVersion.document_id == doc.id
    )
    summaries = db.scalars(
        select(AISummary)
        .where(AISummary.document_version_id.in_(versions_subquery))
        .order_by(AISummary.created_at.desc())
    ).all()

    return [_to_summary_data(s) for s in summaries]


def get_summary(
    db: Session,
    workspace_id: uuid.UUID,
    document_id: uuid.UUID,
    summary_id: uuid.UUID,
) -> AISummaryData:
    """Retrieve specific summary by ID."""
    doc = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.workspace_id == workspace_id,
            MedicalDocument.deleted_at.is_(None),
        )
    )
    if not doc:
        raise NotFoundError("Medical document not found.")

    summary = db.scalar(select(AISummary).where(AISummary.id == summary_id))
    if not summary:
        raise NotFoundError("AI summary not found.")

    return _to_summary_data(summary)
