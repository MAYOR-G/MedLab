"""Unit tests for OpenRouter client, citations, AI summaries, and assistant Q&A."""

import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

from app.db.models import (
    DocumentExtraction,
    DocumentVersion,
    MedicalDocument,
)
from app.integrations.medical_sources.citations import get_relevant_citations
from app.integrations.openrouter.client import OpenRouterClient
from app.modules.assistant.assistant_service import answer_assistant_question
from app.modules.assistant.prompts import MANDATORY_DISCLAIMER, PROMPT_VERSION
from app.modules.assistant.schemas import AssistantQuestionRequest
from app.modules.assistant.summary_service import generate_document_summary


def test_sanitize_input() -> None:
    """Verify personal email and JWT tokens are redacted from prompts."""
    raw_prompt = (
        "User test@example.com with token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID"
    )
    sanitized = OpenRouterClient.sanitize_input(raw_prompt)
    assert "[EMAIL_REDACTED]" in sanitized
    assert "[TOKEN_REDACTED]" in sanitized
    assert "test@example.com" not in sanitized


def test_citation_keyword_matcher() -> None:
    """Verify citations match document content accurately."""
    citations_cmp = get_relevant_citations(
        "Patient has elevated ALT and BUN on metabolic panel"
    )
    assert any("metabolic" in c["title"].lower() for c in citations_cmp)

    citations_lipid = get_relevant_citations(
        "Fasting lipid panel showing high total cholesterol"
    )
    assert any("lipid" in c["title"].lower() for c in citations_lipid)

    citations_fallback = get_relevant_citations("General physical examination")
    assert len(citations_fallback) > 0


@patch("app.modules.assistant.summary_service.openrouter_client")
def test_generate_document_summary(mock_ai: MagicMock) -> None:
    """Verify AI summary generation stores summary linked to document version."""
    mock_ai.generate_chat_completion.return_value = (
        "### Overview\nHealthy test.\n\n### Key Findings\nAll normal.\n\n### Questions\n1. What's next?",
        "claude-3.5-sonnet",
    )

    mock_db = MagicMock()
    workspace_id = uuid.uuid4()
    user_id = uuid.uuid4()
    doc_id = uuid.uuid4()
    version_id = uuid.uuid4()
    now = datetime.now(UTC)

    doc = MedicalDocument(
        id=doc_id,
        workspace_id=workspace_id,
        family_member_id=uuid.uuid4(),
        title="Routine CMP",
        category="lab_result",
        created_at=now,
        updated_at=now,
    )

    version = DocumentVersion(
        id=version_id,
        document_id=doc_id,
        version_number=1,
        storage_bucket="medical-documents",
        storage_key="test.pdf",
        original_filename="test.pdf",
        mime_type="application/pdf",
        file_size_bytes=2000,
        sha256="d" * 64,
        is_current=True,
        uploaded_by_user_id=user_id,
    )

    extraction = DocumentExtraction(
        id=uuid.uuid4(),
        document_version_id=version_id,
        status="succeeded",
        extracted_text="Glucose: 90 mg/dL",
    )

    # scalar calls: 1: doc, 2: version, 3: existing_summary (None), 4: extraction
    mock_db.scalar.side_effect = [doc, version, None, extraction]

    summary = generate_document_summary(
        mock_db,
        workspace_id=workspace_id,
        user_id=user_id,
        document_id=doc_id,
    )

    assert summary.status == "succeeded"
    assert summary.promptVersion == PROMPT_VERSION
    assert summary.model == "claude-3.5-sonnet"
    assert "Overview" in (summary.summaryText or "")
    mock_db.add.assert_called()
    mock_db.flush.assert_called()


@patch("app.modules.assistant.assistant_service.openrouter_client")
def test_answer_assistant_question(mock_ai: MagicMock) -> None:
    """Verify assistant Q&A appends mandatory disclaimer and returns citations."""
    mock_ai.generate_chat_completion.return_value = (
        "Your glucose level of 90 mg/dL is within the standard fasting range.",
        "gpt-4o-mini",
    )

    mock_db = MagicMock()
    workspace_id = uuid.uuid4()
    user_id = uuid.uuid4()
    doc_id = uuid.uuid4()
    now = datetime.now(UTC)

    doc = MedicalDocument(
        id=doc_id,
        workspace_id=workspace_id,
        family_member_id=uuid.uuid4(),
        title="Metabolic Test",
        category="lab_result",
        created_at=now,
        updated_at=now,
    )
    version = MagicMock(id=uuid.uuid4())
    extraction = MagicMock(extracted_text="Glucose: 90 mg/dL")

    mock_db.scalar.side_effect = [doc, version, extraction]

    req = AssistantQuestionRequest(
        question="What does my glucose reading indicate?",
        documentId=doc_id,
    )

    response = answer_assistant_question(
        mock_db,
        workspace_id=workspace_id,
        user_id=user_id,
        payload=req,
    )

    assert "90 mg/dL" in response.answer
    assert response.disclaimer == MANDATORY_DISCLAIMER
    assert len(response.citations) > 0
    mock_db.flush.assert_called()
