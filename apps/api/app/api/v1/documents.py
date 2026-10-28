"""Medical document management API endpoints."""

import uuid

from fastapi import APIRouter, Depends, Header, Query, Request, status
from sqlalchemy.orm import Session

from app.core.rate_limiting import enforce_rate_limit
from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.permissions import get_user_workspace_id
from app.modules.records.schemas import (
    DocumentCompleteUploadRequest,
    DocumentDownloadResponse,
    DocumentInitRequest,
    DocumentInitResponse,
    DocumentListMeta,
    DocumentListResponse,
    DocumentResponse,
    DocumentUpdateRequest,
)
from app.modules.records.service import (
    complete_document_upload,
    get_document,
    get_download_url,
    init_document_upload,
    list_documents,
    list_trash_documents,
    permanent_delete_document,
    restore_document,
    soft_delete_document,
    update_document,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=DocumentListResponse)
def list_workspace_documents(
    request: Request,
    member_id: uuid.UUID | None = Query(
        None, alias="memberId", description="Filter by family member"
    ),
    category: str | None = Query(None, description="Filter by category"),
    search: str | None = Query(None, description="Search title and notes"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentListResponse:
    """List non-deleted medical documents for caller's workspace."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    items, total_count = list_documents(
        db,
        workspace_id=workspace_id,
        member_id=member_id,
        category=category,
        search=search,
        limit=limit,
        offset=offset,
    )
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return DocumentListResponse(
        data=items,
        meta=DocumentListMeta(totalCount=total_count, limit=limit, offset=offset),
        requestId=request_id,
    )


@router.post(
    "", response_model=DocumentInitResponse, status_code=status.HTTP_201_CREATED
)
def initialize_document_upload(
    request: Request,
    payload: DocumentInitRequest,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentInitResponse:
    """Initialize a medical document upload session and obtain presigned PUT URL."""
    enforce_rate_limit(
        request,
        scope="document_upload",
        max_requests=10,
        window_seconds=60,
        identifier_override=f"upload:{current_user.user_id}",
    )
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    doc_data, version_id, upload_url, storage_key = init_document_upload(
        db,
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        payload=payload,
        request_id=request_id,
    )

    return DocumentInitResponse(
        document=doc_data,
        versionId=version_id,
        uploadUrl=upload_url,
        storageKey=storage_key,
        requestId=request_id,
    )


@router.get("/trash", response_model=DocumentListResponse)
def get_trashed_documents(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentListResponse:
    """List soft-deleted medical documents in trash for caller's workspace."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    items = list_trash_documents(db, workspace_id=workspace_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return DocumentListResponse(
        data=items,
        meta=DocumentListMeta(totalCount=len(items), limit=len(items), offset=0),
        requestId=request_id,
    )


@router.post("/{documentId}/complete-upload", response_model=DocumentResponse)
def complete_upload(
    request: Request,
    documentId: uuid.UUID,
    payload: DocumentCompleteUploadRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """Finalize document upload, mark version as current, and queue background processing."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    doc_data = complete_document_upload(
        db,
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        document_id=documentId,
        payload=payload,
        request_id=request_id,
    )

    return DocumentResponse(data=doc_data, requestId=request_id)


@router.get("/{documentId}", response_model=DocumentResponse)
def get_document_details(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """Retrieve details for a single document."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    doc_data = get_document(db, workspace_id=workspace_id, document_id=documentId)
    return DocumentResponse(data=doc_data, requestId=request_id)


@router.patch("/{documentId}", response_model=DocumentResponse)
def update_document_metadata(
    request: Request,
    documentId: uuid.UUID,
    payload: DocumentUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """Update medical document metadata."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    doc_data = update_document(
        db,
        workspace_id=workspace_id,
        document_id=documentId,
        payload=payload,
    )
    return DocumentResponse(data=doc_data, requestId=request_id)


@router.delete("/{documentId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Soft-delete a medical document and revoke active share links."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    soft_delete_document(
        db,
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        document_id=documentId,
        request_id=request_id,
    )


@router.post("/{documentId}/restore", response_model=DocumentResponse)
def restore_trashed_document(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """Restore a soft-deleted document from trash."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    doc_data = restore_document(
        db,
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        document_id=documentId,
        request_id=request_id,
    )
    return DocumentResponse(data=doc_data, requestId=request_id)


@router.delete("/{documentId}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def purge_document_permanently(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Permanently delete a medical document, its files from storage, and all derived records."""
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    permanent_delete_document(
        db,
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        document_id=documentId,
        request_id=request_id,
    )


@router.get("/{documentId}/download", response_model=DocumentDownloadResponse)
def get_document_download(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentDownloadResponse:
    """Obtain short-lived presigned download URL for document's current version."""
    enforce_rate_limit(
        request,
        scope="document_download",
        max_requests=20,
        window_seconds=60,
        identifier_override=f"download:{current_user.user_id}",
    )
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    download_url, expires_in, filename = get_download_url(
        db,
        workspace_id=workspace_id,
        user_id=current_user.user_id,
        document_id=documentId,
        request_id=request_id,
    )

    return DocumentDownloadResponse(
        downloadUrl=download_url,
        expiresInSeconds=expires_in,
        filename=filename,
        requestId=request_id,
    )
