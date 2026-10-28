"""API endpoints for secure document sharing and public recipient access."""

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.rate_limiting import enforce_rate_limit
from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.permissions import get_user_workspace_id
from app.modules.sharing.schemas import (
    CreateShareLinkRequest,
    PublicShareDocumentResponse,
    ShareLinkCreatedResponse,
    ShareLinkItem,
    ShareLinkListResponse,
)
from app.modules.sharing.service import (
    access_public_share,
    create_share_link,
    list_document_shares,
    list_workspace_shares,
    revoke_share_link,
)

router = APIRouter(tags=["sharing"])


@router.post(
    "/documents/{documentId}/shares",
    response_model=ShareLinkCreatedResponse,
    status_code=201,
    summary="Create an expiring, revocable share link for a document",
)
def create_document_share_link(
    request: Request,
    documentId: uuid.UUID,
    payload: CreateShareLinkRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareLinkCreatedResponse:
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    return create_share_link(
        db=db,
        document_id=documentId,
        user_id=current_user.user_id,
        workspace_id=workspace_id,
        req=payload,
    )


@router.get(
    "/documents/{documentId}/shares",
    response_model=ShareLinkListResponse,
    summary="List all share links generated for a document",
)
def get_document_share_links(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareLinkListResponse:
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    return list_document_shares(
        db=db,
        document_id=documentId,
        workspace_id=workspace_id,
    )


@router.get(
    "/shares",
    response_model=ShareLinkListResponse,
    summary="List all share links in the workspace",
)
def get_workspace_share_links(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareLinkListResponse:
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    return list_workspace_shares(
        db=db,
        workspace_id=workspace_id,
    )


@router.delete(
    "/shares/{shareLinkId}",
    response_model=ShareLinkItem,
    summary="Revoke an active share link immediately",
)
def revoke_share(
    request: Request,
    shareLinkId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareLinkItem:
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    return revoke_share_link(
        db=db,
        share_link_id=shareLinkId,
        user_id=current_user.user_id,
        workspace_id=workspace_id,
    )


@router.get(
    "/public/shares/{token}",
    response_model=PublicShareDocumentResponse,
    summary="Public recipient access to shared medical record (no auth required)",
)
def get_public_share(
    request: Request,
    token: str,
    db: Session = Depends(get_db),
) -> PublicShareDocumentResponse:
    enforce_rate_limit(request, scope="public_shares", max_requests=60, window_seconds=60)
    return access_public_share(
        db=db,
        token=token,
    )
