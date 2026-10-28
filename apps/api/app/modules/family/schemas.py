"""Pydantic schemas for family workspace and members."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.models.family_members import VALID_RELATIONSHIPS


# --- Workspace Schemas ---
class WorkspaceData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    status: str
    createdAt: datetime
    updatedAt: datetime


class WorkspaceResponse(BaseModel):
    data: WorkspaceData
    requestId: str


class WorkspaceUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Workspace name cannot be empty.")
        return trimmed


# --- Family Member Schemas ---
class FamilyMemberData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    fullName: str
    relationship: str
    dateOfBirth: date | None = None
    notes: str | None = None
    createdAt: datetime
    updatedAt: datetime


class FamilyMemberResponse(BaseModel):
    data: FamilyMemberData
    requestId: str


class FamilyMemberListMeta(BaseModel):
    totalCount: int
    limit: int
    offset: int


class FamilyMemberListResponse(BaseModel):
    data: list[FamilyMemberData]
    meta: FamilyMemberListMeta
    requestId: str


class FamilyMemberCreateRequest(BaseModel):
    fullName: str = Field(..., min_length=1, max_length=160)
    relationship: str = Field(default="unspecified")
    dateOfBirth: date | None = None
    notes: str | None = None

    @field_validator("fullName")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Full name cannot be empty.")
        return trimmed

    @field_validator("relationship")
    @classmethod
    def validate_relationship(cls, v: str) -> str:
        clean_v = v.strip().lower()
        if clean_v not in VALID_RELATIONSHIPS:
            raise ValueError(
                f"Invalid relationship '{v}'. Allowed: {VALID_RELATIONSHIPS}"
            )
        return clean_v

    @field_validator("dateOfBirth")
    @classmethod
    def validate_dob(cls, v: date | None) -> date | None:
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future.")
        return v


class FamilyMemberUpdateRequest(BaseModel):
    fullName: str | None = Field(None, min_length=1, max_length=160)
    relationship: str | None = None
    dateOfBirth: date | None = None
    notes: str | None = None

    @field_validator("fullName")
    @classmethod
    def validate_full_name(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Full name cannot be empty.")
            return trimmed
        return v

    @field_validator("relationship")
    @classmethod
    def validate_relationship(cls, v: str | None) -> str | None:
        if v is not None:
            clean_v = v.strip().lower()
            if clean_v not in VALID_RELATIONSHIPS:
                raise ValueError(
                    f"Invalid relationship '{v}'. Allowed: {VALID_RELATIONSHIPS}"
                )
            return clean_v
        return v

    @field_validator("dateOfBirth")
    @classmethod
    def validate_dob(cls, v: date | None) -> date | None:
        if v is not None and v > date.today():
            raise ValueError("Date of birth cannot be in the future.")
        return v
