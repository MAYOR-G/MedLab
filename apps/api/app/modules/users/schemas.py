"""Pydantic schemas for user profile operations."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserProfileData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="User UUID (matches auth.users.id)")
    displayName: str | None = Field(None, max_length=120)
    isCompleted: bool = Field(
        default=False,
        description="Whether the account owner has completed their profile details and primary member record",
    )
    createdAt: datetime
    updatedAt: datetime


class UserProfileResponse(BaseModel):
    data: UserProfileData
    requestId: str


class UserProfileUpdateRequest(BaseModel):
    displayName: str | None = Field(None, max_length=120)

    @field_validator("displayName")
    @classmethod
    def validate_display_name(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Display name cannot be empty when provided.")
            return trimmed
        return v


class OnboardingRequest(BaseModel):
    fullName: str = Field(..., min_length=1, max_length=120)
    dateOfBirth: date | None = None
    notes: str | None = None
    workspaceName: str | None = Field(None, max_length=120)

    @field_validator("fullName")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Full name cannot be empty.")
        return trimmed

    @field_validator("dateOfBirth")
    @classmethod
    def validate_dob(cls, v: date | None) -> date | None:
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future.")
        return v

    @field_validator("workspaceName")
    @classmethod
    def validate_workspace_name(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            return trimmed if trimmed else None
        return None

