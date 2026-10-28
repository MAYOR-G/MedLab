"""User profile endpoints."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.errors import get_request_id
from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.modules.users import service
from app.modules.users.schemas import (
    OnboardingRequest,
    UserProfileResponse,
    UserProfileUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    """Retrieve the authenticated user's profile."""
    profile_data = service.get_or_create_profile(db, current_user.user_id)
    return UserProfileResponse(
        data=profile_data,
        requestId=get_request_id(request),
    )


@router.post("/onboarding", response_model=UserProfileResponse)
def complete_user_onboarding(
    request: Request,
    onboarding_data: OnboardingRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    """Complete account owner onboarding and initialize workspace and self member."""
    profile_data = service.complete_onboarding(
        db, current_user.user_id, onboarding_data
    )
    return UserProfileResponse(
        data=profile_data,
        requestId=get_request_id(request),
    )


@router.patch("/me", response_model=UserProfileResponse)
def update_my_profile(
    request: Request,
    update_data: UserProfileUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    """Update display name on the authenticated user's profile."""
    profile_data = service.update_profile(db, current_user.user_id, update_data)
    return UserProfileResponse(
        data=profile_data,
        requestId=get_request_id(request),
    )
