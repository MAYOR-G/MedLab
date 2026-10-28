"""Pydantic schemas for medical documents and versions."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.db.models.document_versions import VALID_MIME_TYPES
from app.db.models.documents import VALID_DOCUMENT_CATEGORIES

ALLOWED_MIME_TYPES = VALID_MIME_TYPES
MAX_FILE_SIZE_BYTES = 26214440  # 25 MB


class DocumentVersionData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    versionNumber: int
    originalFilename: str
    mimeType: str
    fileSizeBytes: int
    sha256: str
    isCurrent: bool
    createdAt: datetime


class DocumentData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspaceId: uuid.UUID
    familyMemberId: uuid.UUID
    familyMemberName: str
    title: str
    category: str
    documentDate: date | None = None
    notes: str | None = None
    currentVersion: DocumentVersionData | None = None
    deletedAt: datetime | None = None
    purgeAfter: datetime | None = None
    createdAt: datetime
    updatedAt: datetime


class DocumentInitRequest(BaseModel):
    memberId: uuid.UUID
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(default="lab_result")
    originalFilename: str = Field(..., min_length=1, max_length=255)
    mimeType: str
    fileSizeBytes: int = Field(..., gt=0, le=MAX_FILE_SIZE_BYTES)
    documentDate: date | None = None
    notes: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Document title cannot be empty.")
        return trimmed

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        clean_v = v.strip().lower()
        if clean_v not in VALID_DOCUMENT_CATEGORIES:
            raise ValueError(
                f"Invalid category '{v}'. Allowed: {VALID_DOCUMENT_CATEGORIES}"
            )
        return clean_v

    @field_validator("mimeType")
    @classmethod
    def validate_mime(cls, v: str) -> str:
        clean_v = v.strip().lower()
        if clean_v not in ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Unsupported MIME type '{v}'. Allowed: {ALLOWED_MIME_TYPES}"
            )
        return clean_v

    @field_validator("documentDate")
    @classmethod
    def validate_doc_date(cls, v: date | None) -> date | None:
        if v is not None and v > date.today():
            raise ValueError("Document date cannot be in the future.")
        return v


class DocumentInitResponse(BaseModel):
    document: DocumentData
    versionId: uuid.UUID
    uploadUrl: str
    storageKey: str
    requestId: str


class DocumentCompleteUploadRequest(BaseModel):
    versionId: uuid.UUID
    sha256: str | None = Field(None, min_length=64, max_length=64)


class DocumentUpdateRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    category: str | None = None
    documentDate: date | None = None
    notes: str | None = None
    familyMemberId: uuid.UUID | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Document title cannot be empty.")
            return trimmed
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str | None) -> str | None:
        if v is not None:
            clean_v = v.strip().lower()
            if clean_v not in VALID_DOCUMENT_CATEGORIES:
                raise ValueError(
                    f"Invalid category '{v}'. Allowed: {VALID_DOCUMENT_CATEGORIES}"
                )
            return clean_v
        return v

    @field_validator("documentDate")
    @classmethod
    def validate_doc_date(cls, v: date | None) -> date | None:
        if v is not None and v > date.today():
            raise ValueError("Document date cannot be in the future.")
        return v


class DocumentResponse(BaseModel):
    data: DocumentData
    requestId: str


class DocumentListMeta(BaseModel):
    totalCount: int
    limit: int
    offset: int


class DocumentListResponse(BaseModel):
    data: list[DocumentData]
    meta: DocumentListMeta
    requestId: str


class DocumentDownloadResponse(BaseModel):
    downloadUrl: str
    expiresInSeconds: int
    filename: str
    requestId: str
