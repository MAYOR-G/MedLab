"""Business logic for family workspace and members."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.db.models import (
    DocumentVersion,
    FamilyMember,
    FamilyWorkspace,
    MedicalDocument,
    ShareLink,
)
from app.modules.family.schemas import (
    FamilyMemberCreateRequest,
    FamilyMemberData,
    FamilyMemberUpdateRequest,
    WorkspaceData,
    WorkspaceUpdateRequest,
)


def get_workspace(db: Session, owner_user_id: uuid.UUID) -> WorkspaceData:
    """Retrieve or auto-create owner's primary family workspace."""
    workspace = db.scalar(
        select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == owner_user_id)
    )
    if not workspace:
        now = datetime.now(UTC)
        workspace = FamilyWorkspace(
            id=uuid.uuid4(),
            owner_user_id=owner_user_id,
            name="My Family",
            status="active",
            created_at=now,
            updated_at=now,
        )
        db.add(workspace)
        db.flush()

    return WorkspaceData(
        id=workspace.id,
        name=workspace.name,
        status=workspace.status,
        createdAt=workspace.created_at,
        updatedAt=workspace.updated_at,
    )


def update_workspace(
    db: Session, owner_user_id: uuid.UUID, update_data: WorkspaceUpdateRequest
) -> WorkspaceData:
    """Rename workspace."""
    workspace = db.scalar(
        select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == owner_user_id)
    )
    if not workspace:
        raise NotFoundError("Workspace not found.")
    if workspace.status != "active":
        raise ConflictError(f"Cannot update workspace in status '{workspace.status}'.")

    workspace.name = update_data.name
    db.flush()

    return WorkspaceData(
        id=workspace.id,
        name=workspace.name,
        status=workspace.status,
        createdAt=workspace.created_at,
        updatedAt=workspace.updated_at,
    )


def list_family_members(
    db: Session,
    workspace_id: uuid.UUID,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[FamilyMemberData], int]:
    """List non-deleted family members for workspace with search and pagination."""
    query = select(FamilyMember).where(
        FamilyMember.workspace_id == workspace_id,
        FamilyMember.deleted_at.is_(None),
    )

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.where(FamilyMember.display_name.ilike(search_filter))

    total_count = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    members = db.scalars(
        query.order_by(FamilyMember.created_at.asc()).offset(offset).limit(limit)
    ).all()

    items = [
        FamilyMemberData(
            id=m.id,
            fullName=m.display_name,
            relationship=m.relationship_label,
            dateOfBirth=m.date_of_birth,
            notes=m.notes,
            createdAt=m.created_at,
            updatedAt=m.updated_at,
        )
        for m in members
    ]
    return items, total_count


def create_family_member(
    db: Session,
    workspace_id: uuid.UUID,
    create_data: FamilyMemberCreateRequest,
) -> FamilyMemberData:
    """Add a new family member to workspace."""
    if create_data.relationship == "self":
        existing_self = db.scalar(
            select(FamilyMember).where(
                FamilyMember.workspace_id == workspace_id,
                FamilyMember.relationship_label == "self",
                FamilyMember.deleted_at.is_(None),
            )
        )
        if existing_self:
            raise ConflictError("Account owner profile already exists in this workspace.")

    now = datetime.now(UTC)
    member = FamilyMember(
        id=uuid.uuid4(),
        workspace_id=workspace_id,
        display_name=create_data.fullName,
        relationship_label=create_data.relationship,
        date_of_birth=create_data.dateOfBirth,
        notes=create_data.notes,
        created_at=now,
        updated_at=now,
    )
    db.add(member)
    db.flush()

    return FamilyMemberData(
        id=member.id,
        fullName=member.display_name,
        relationship=member.relationship_label,
        dateOfBirth=member.date_of_birth,
        notes=member.notes,
        createdAt=member.created_at,
        updatedAt=member.updated_at,
    )


def get_family_member(
    db: Session, workspace_id: uuid.UUID, member_id: uuid.UUID
) -> FamilyMemberData:
    """Retrieve family member profile."""
    member = db.scalar(
        select(FamilyMember).where(
            FamilyMember.id == member_id,
            FamilyMember.workspace_id == workspace_id,
            FamilyMember.deleted_at.is_(None),
        )
    )
    if not member:
        raise NotFoundError("Family member not found.")

    return FamilyMemberData(
        id=member.id,
        fullName=member.display_name,
        relationship=member.relationship_label,
        dateOfBirth=member.date_of_birth,
        notes=member.notes,
        createdAt=member.created_at,
        updatedAt=member.updated_at,
    )


def update_family_member(
    db: Session,
    workspace_id: uuid.UUID,
    member_id: uuid.UUID,
    update_data: FamilyMemberUpdateRequest,
) -> FamilyMemberData:
    """Update family member profile."""
    member = db.scalar(
        select(FamilyMember).where(
            FamilyMember.id == member_id,
            FamilyMember.workspace_id == workspace_id,
            FamilyMember.deleted_at.is_(None),
        )
    )
    if not member:
        raise NotFoundError("Family member not found.")

    if update_data.fullName is not None:
        member.display_name = update_data.fullName
    if update_data.relationship is not None:
        member.relationship_label = update_data.relationship
    if update_data.dateOfBirth is not None:
        member.date_of_birth = update_data.dateOfBirth
    if update_data.notes is not None:
        member.notes = update_data.notes

    db.flush()

    return FamilyMemberData(
        id=member.id,
        fullName=member.display_name,
        relationship=member.relationship_label,
        dateOfBirth=member.date_of_birth,
        notes=member.notes,
        createdAt=member.created_at,
        updatedAt=member.updated_at,
    )


def soft_delete_family_member(
    db: Session, workspace_id: uuid.UUID, member_id: uuid.UUID
) -> None:
    """Soft-delete family member and cascade soft-deletion to documents and share revocation."""
    member = db.scalar(
        select(FamilyMember).where(
            FamilyMember.id == member_id,
            FamilyMember.workspace_id == workspace_id,
            FamilyMember.deleted_at.is_(None),
        )
    )
    if not member:
        raise NotFoundError("Family member not found.")

    now = datetime.now(UTC)
    purge_time = now + timedelta(days=30)
    member.deleted_at = now
    member.purge_after = purge_time

    # Soft-delete all associated medical documents
    db.execute(
        update(MedicalDocument)
        .where(
            MedicalDocument.family_member_id == member_id,
            MedicalDocument.deleted_at.is_(None),
        )
        .values(deleted_at=now, purge_after=purge_time)
    )

    # Immediately revoke active share links for those documents
    doc_ids_subquery = select(MedicalDocument.id).where(
        MedicalDocument.family_member_id == member_id
    )
    versions_subquery = select(DocumentVersion.id).where(
        DocumentVersion.document_id.in_(doc_ids_subquery)
    )
    db.execute(
        update(ShareLink)
        .where(
            ShareLink.revoked_at.is_(None),
            ShareLink.document_version_id.in_(versions_subquery),
        )
        .values(revoked_at=now)
    )

    db.flush()
