"""AI Health Assistant Q&A service scoped to documents or family members."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.db.models import (
    DocumentExtraction,
    DocumentVersion,
    FamilyMember,
    MedicalDocument,
)
from app.integrations.medical_sources.citations import get_relevant_citations
from app.integrations.openrouter.client import openrouter_client
from app.modules.assistant.prompts import MANDATORY_DISCLAIMER, QA_SYSTEM_PROMPT
from app.modules.assistant.schemas import (
    AssistantQuestionRequest,
    AssistantQuestionResponse,
)
from app.services.audit_service import record_audit_event


def answer_assistant_question(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: AssistantQuestionRequest,
    request_id: str | None = None,
) -> AssistantQuestionResponse:
    """Provide plain-English clinical Q&A grounded in authorized records."""
    context_chunks: list[str] = []
    citation_source_text = payload.question

    if payload.documentId:
        doc = db.scalar(
            select(MedicalDocument).where(
                MedicalDocument.id == payload.documentId,
                MedicalDocument.workspace_id == workspace_id,
                MedicalDocument.deleted_at.is_(None),
            )
        )
        if not doc:
            raise NotFoundError("Referenced medical document not found.")

        version = db.scalar(
            select(DocumentVersion).where(
                DocumentVersion.document_id == doc.id,
                DocumentVersion.is_current.is_(True),
            )
        )
        if version:
            extraction = db.scalar(
                select(DocumentExtraction).where(
                    DocumentExtraction.document_version_id == version.id
                )
            )
            extracted_text = (extraction.extracted_text or "") if extraction else ""
            context_chunks.append(
                f"[Document: {doc.title} ({doc.category}, Date: {doc.document_date or 'Recent'})]\n{extracted_text}"
            )
            citation_source_text += f" {extracted_text}"

    elif payload.familyMemberId:
        member = db.scalar(
            select(FamilyMember).where(
                FamilyMember.id == payload.familyMemberId,
                FamilyMember.workspace_id == workspace_id,
                FamilyMember.deleted_at.is_(None),
            )
        )
        if not member:
            raise NotFoundError("Referenced family member not found.")

        # Load up to 5 recent documents for member
        docs = db.scalars(
            select(MedicalDocument)
            .where(
                MedicalDocument.family_member_id == member.id,
                MedicalDocument.deleted_at.is_(None),
            )
            .order_by(MedicalDocument.document_date.desc().nullslast())
            .limit(5)
        ).all()

        for d in docs:
            v = db.scalar(
                select(DocumentVersion).where(
                    DocumentVersion.document_id == d.id,
                    DocumentVersion.is_current.is_(True),
                )
            )
            if v:
                ext = db.scalar(
                    select(DocumentExtraction).where(
                        DocumentExtraction.document_version_id == v.id
                    )
                )
                if ext and ext.extracted_text:
                    context_chunks.append(
                        f"[Record: {d.title} ({d.category})]\n{ext.extracted_text}"
                    )
                    citation_source_text += " " + ext.extracted_text

    assembled_context = (
        "\n\n".join(context_chunks)
        if context_chunks
        else "No specific documents attached. Answering general health literacy inquiry."
    )

    prompt = f"Patient Records Context:\n{assembled_context}\n\nPatient Question:\n{payload.question}"
    answer, model_used = openrouter_client.generate_chat_completion(
        system_prompt=QA_SYSTEM_PROMPT,
        user_message=prompt,
    )

    citations = get_relevant_citations(citation_source_text)

    record_audit_event(
        db,
        action="AI_ASSISTANT_QUERY",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        document_id=payload.documentId,
        request_id=request_id,
        metadata={"model": model_used, "has_context": bool(context_chunks)},
    )

    return AssistantQuestionResponse(
        answer=answer,
        citations=citations,
        disclaimer=MANDATORY_DISCLAIMER,
        requestId=request_id or str(uuid.uuid4()),
    )
