"""Audit logging service for security-relevant events."""

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import AuditEvent


def record_audit_event(
    db: Session,
    action: str,
    outcome: str,
    actor_user_id: uuid.UUID | None = None,
    workspace_id: uuid.UUID | None = None,
    document_id: uuid.UUID | None = None,
    share_link_id: uuid.UUID | None = None,
    request_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditEvent:
    """Record an append-only security event without medical details."""
    event = AuditEvent(
        action=action,
        outcome=outcome.lower(),
        actor_user_id=actor_user_id,
        workspace_id=workspace_id,
        document_id=document_id,
        share_link_id=share_link_id,
        request_id=request_id,
        metadata_json=metadata or {},
    )
    db.add(event)
    db.flush()
    return event
