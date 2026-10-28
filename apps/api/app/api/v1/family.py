"""Family member endpoints."""

import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, get_request_id
from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.permissions import get_user_workspace
from app.modules.family import service
from app.modules.family.schemas import (
    FamilyMemberCreateRequest,
    FamilyMemberListMeta,
    FamilyMemberListResponse,
    FamilyMemberResponse,
    FamilyMemberUpdateRequest,
)

router = APIRouter(prefix="/family-members", tags=["Family Members"])


@router.get("", response_model=FamilyMemberListResponse)
def list_family_members(
    request: Request,
    search: str | None = Query(None, description="Search by name"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FamilyMemberListResponse:
    """List non-deleted family members for the caller's workspace."""
    workspace = get_user_workspace(db, current_user.user_id)
    items, total = service.list_family_members(
        db, workspace.id, search=search, limit=limit, offset=offset
    )
    return FamilyMemberListResponse(
        data=items,
        meta=FamilyMemberListMeta(totalCount=total, limit=limit, offset=offset),
        requestId=get_request_id(request),
    )


@router.post(
    "", response_model=FamilyMemberResponse, status_code=status.HTTP_201_CREATED
)
def create_family_member(
    request: Request,
    create_data: FamilyMemberCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FamilyMemberResponse:
    """Add a new family member to caller's workspace."""
    workspace = get_user_workspace(db, current_user.user_id)
    member = service.create_family_member(db, workspace.id, create_data)
    return FamilyMemberResponse(
        data=member,
        requestId=get_request_id(request),
    )


@router.get("/{memberId}", response_model=FamilyMemberResponse)
def get_family_member(
    request: Request,
    memberId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FamilyMemberResponse:
    """Retrieve details for a single family member."""
    workspace = get_user_workspace(db, current_user.user_id)
    member = service.get_family_member(db, workspace.id, memberId)
    return FamilyMemberResponse(
        data=member,
        requestId=get_request_id(request),
    )


@router.patch("/{memberId}", response_model=FamilyMemberResponse)
def update_family_member(
    request: Request,
    memberId: uuid.UUID,
    update_data: FamilyMemberUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FamilyMemberResponse:
    """Update family member profile."""
    workspace = get_user_workspace(db, current_user.user_id)
    member = service.update_family_member(db, workspace.id, memberId, update_data)
    return FamilyMemberResponse(
        data=member,
        requestId=get_request_id(request),
    )


@router.delete("/{memberId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family_member(
    memberId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Soft-delete a family member and revoke their document share links."""
    workspace = get_user_workspace(db, current_user.user_id)
    member = service.get_family_member(db, workspace.id, memberId)
    if member.relationship.lower() == "self":
        raise ConflictError("Cannot delete primary account owner profile.")
    service.soft_delete_family_member(db, workspace.id, memberId)
