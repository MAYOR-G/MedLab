"""AI Health Assistant and Summaries API endpoints."""

import uuid

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.rate_limiting import enforce_rate_limit
from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.permissions import get_user_workspace_id
from app.modules.assistant.assistant_service import answer_assistant_question
from app.modules.assistant.schemas import (
    AISummaryListResponse,
    AISummaryResponse,
    AssistantQuestionRequest,
    AssistantQuestionResponse,
)
from app.modules.assistant.summary_service import (
    generate_document_summary,
    get_summary,
    list_document_summaries,
)

router = APIRouter(tags=["AI Assistant"])


@router.post(
    "/documents/{documentId}/summaries",
    response_model=AISummaryResponse,
    status_code=status.HTTP_201_CREATED,
)
def request_document_summary(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AISummaryResponse:
    """Generate or retrieve plain-English AI summary for document's active version."""
    enforce_rate_limit(
        request,
        scope="ai_summary",
        max_requests=5,
        window_seconds=60,
        identifier_override=f"summary:{current_user.user_id}",
    )
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    summary_data = generate_document_summary(
        db,
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        document_id=documentId,
        request_id=request_id,
    )
    return AISummaryResponse(data=summary_data, requestId=request_id)


@router.get("/documents/{documentId}/summaries", response_model=AISummaryListResponse)
def get_document_summaries(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AISummaryListResponse:
    """List all AI summaries generated for a document."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    items = list_document_summaries(
        db,
        workspace_id=workspace_id,
        document_id=documentId,
    )
    return AISummaryListResponse(data=items, requestId=request_id)


@router.get(
    "/documents/{documentId}/summaries/{summaryId}", response_model=AISummaryResponse
)
def get_single_summary(
    request: Request,
    documentId: uuid.UUID,
    summaryId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AISummaryResponse:
    """Retrieve details for a specific AI summary."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    summary_data = get_summary(
        db,
        workspace_id=workspace_id,
        document_id=documentId,
        summary_id=summaryId,
    )
    return AISummaryResponse(data=summary_data, requestId=request_id)


@router.post("/assistant/questions", response_model=AssistantQuestionResponse)
def ask_assistant_question(
    request: Request,
    payload: AssistantQuestionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssistantQuestionResponse:
    """Submit a health literacy question scoped to a document or family member."""
    enforce_rate_limit(
        request,
        scope="assistant_question",
        max_requests=10,
        window_seconds=60,
        identifier_override=f"question:{current_user.user_id}",
    )
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    return answer_assistant_question(
        db,
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        payload=payload,
        request_id=request_id,
    )
