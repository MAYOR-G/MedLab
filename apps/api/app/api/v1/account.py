"""Account and workspace lifecycle API endpoints."""

import uuid

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.permissions import get_user_workspace_id
from app.modules.users.deletion_service import (
    AccountDeletionRequest,
    AccountDeletionResponse,
    request_workspace_deletion,
)

router = APIRouter(prefix="/account", tags=["Account"])


@router.post(
    "/deletion-requests",
    response_model=AccountDeletionResponse,
    status_code=status.HTTP_200_OK,
)
def request_account_deletion_endpoint(
    request: Request,
    payload: AccountDeletionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccountDeletionResponse:
    """Request complete deletion of caller's workspace and medical data."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    return request_workspace_deletion(
        db,
        user_id=current_user.user_id,
        workspace_id=workspace_id,
        confirmation=payload.confirmationText,
        request_id=request_id,
    )
