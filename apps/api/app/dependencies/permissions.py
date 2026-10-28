"""Workspace and resource permission verification dependencies."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AuthorizationError, NotFoundError
from app.db.models import FamilyWorkspace


def get_user_workspace(db: Session, owner_user_id: uuid.UUID) -> FamilyWorkspace:
    """Retrieve or auto-provision the default workspace for an authenticated owner."""
    workspace = db.scalar(
        select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == owner_user_id)
    )
    if not workspace:
        workspace = FamilyWorkspace(
            owner_user_id=owner_user_id,
            name="My Family",
            status="active",
        )
        db.add(workspace)
        db.flush()
    return workspace


def get_user_workspace_id(db: Session, owner_user_id: uuid.UUID) -> uuid.UUID:
    """Retrieve the primary workspace UUID for an authenticated user."""
    return get_user_workspace(db, owner_user_id).id


def verify_workspace_owner(
    db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID
) -> FamilyWorkspace:
    """Verify that user_id is the sole owner of workspace_id."""
    workspace = db.scalar(
        select(FamilyWorkspace).where(FamilyWorkspace.id == workspace_id)
    )
    if not workspace:
        raise NotFoundError("Workspace not found.")
    if workspace.owner_user_id != user_id:
        raise AuthorizationError("You do not own this workspace.")
    if workspace.status != "active":
        raise AuthorizationError(f"Workspace is not active ({workspace.status}).")
    return workspace
