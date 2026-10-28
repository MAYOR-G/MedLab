"""Family workspace endpoints."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import get_request_id
from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.modules.family import service
from app.modules.family.schemas import WorkspaceResponse, WorkspaceUpdateRequest

router = APIRouter(prefix="/workspace", tags=["Workspace"])


@router.get("", response_model=WorkspaceResponse)
def get_my_workspace(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceResponse:
    """Retrieve the authenticated user's family workspace."""
    workspace = service.get_workspace(db, current_user.user_id)
    return WorkspaceResponse(
        data=workspace,
        requestId=get_request_id(request),
    )


@router.patch("", response_model=WorkspaceResponse)
def update_my_workspace(
    request: Request,
    update_data: WorkspaceUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceResponse:
    """Rename the authenticated user's family workspace."""
    workspace = service.update_workspace(db, current_user.user_id, update_data)
    return WorkspaceResponse(
        data=workspace,
        requestId=get_request_id(request),
    )
