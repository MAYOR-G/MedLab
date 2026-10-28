"""Service for handling account and workspace deletion workflows."""

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, NotFoundError
from app.db.models import (
    DocumentVersion,
    FamilyWorkspace,
    MedicalDocument,
    ShareLink,
)
from app.services.audit_service import record_audit_event


class AccountDeletionRequest(BaseModel):
    confirmationText: str = Field(
        ...,
        description="User must type their workspace name or DELETE to confirm.",
    )


class AccountDeletionResponse(BaseModel):
    status: str = Field(..., description="Workspace status, e.g. pending_deletion")
    message: str = Field(..., description="User-facing explanation of deletion state")
    scheduledPurgeAt: datetime = Field(..., description="When data will be permanently purged")
    requestId: str


def request_workspace_deletion(
    db: Session,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    confirmation: str,
    request_id: str | None = None,
) -> AccountDeletionResponse:
    """Initiate workspace account deletion workflow."""
    workspace = db.scalar(
        select(FamilyWorkspace).where(FamilyWorkspace.id == workspace_id)
    )
    if not workspace:
        raise NotFoundError("Workspace not found.")

    if workspace.owner_user_id != user_id:
        raise ForbiddenError("Only the workspace owner can request account deletion.")

    # Confirm name matches or 'DELETE'
    cleaned_confirmation = confirmation.strip()
    if cleaned_confirmation != workspace.name and cleaned_confirmation != "DELETE":
        raise ForbiddenError(
            f"Confirmation does not match workspace name '{workspace.name}' or 'DELETE'."
        )

    now = datetime.now(UTC)
    workspace.status = "pending_deletion"
    workspace.updated_at = now

    # Revoke all active share links in this workspace
    workspace_versions_subquery = (
        select(DocumentVersion.id)
        .join(MedicalDocument, DocumentVersion.document_id == MedicalDocument.id)
        .where(MedicalDocument.workspace_id == workspace_id)
    )

    db.execute(
        update(ShareLink)
        .where(
            ShareLink.document_version_id.in_(workspace_versions_subquery),
            ShareLink.revoked_at.is_(None),
        )
        .values(revoked_at=now)
    )
    db.flush()

    record_audit_event(
        db,
        action="WORKSPACE_DELETION_REQUESTED",
        outcome="SUCCESS",
        actor_user_id=user_id,
        workspace_id=workspace_id,
        request_id=request_id,
        metadata={"workspace_name": workspace.name},
    )

    return AccountDeletionResponse(
        status="pending_deletion",
        message="Workspace marked for permanent deletion. All active share links revoked.",
        scheduledPurgeAt=now,
        requestId=request_id or str(uuid.uuid4()),
    )
