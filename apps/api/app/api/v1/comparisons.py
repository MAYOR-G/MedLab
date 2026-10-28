"""API endpoints for structured medical measurements and historical biomarker trends."""

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.core.security import AuthenticatedUser
from app.db.models.family_members import FamilyMember
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.dependencies.permissions import get_user_workspace_id
from app.modules.comparisons.schemas import (
    AnalyteListResponse,
    MeasurementListResponse,
    MeasurementTrendSeries,
)
from app.modules.comparisons.service import (
    get_member_measurement_trends,
    list_document_measurements,
    list_member_analytes,
    list_member_measurements,
)
from app.services.audit_service import record_audit_event

router = APIRouter(tags=["comparisons"])


def _verify_member_workspace(
    db: Session,
    member_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> FamilyMember:
    """Ensure family member exists and belongs to caller's workspace."""
    member = (
        db.query(FamilyMember)
        .filter(
            FamilyMember.id == member_id,
            FamilyMember.workspace_id == workspace_id,
        )
        .first()
    )
    if not member:
        raise NotFoundError(
            message="Family member was not found in your workspace",
            code="MEMBER_NOT_FOUND",
        )
    return member


@router.get(
    "/family-members/{memberId}/measurements",
    response_model=MeasurementListResponse,
    summary="List structured measurements for a family member",
)
def get_member_measurements(
    request: Request,
    memberId: uuid.UUID,
    test_key: str | None = Query(None, alias="test_key"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeasurementListResponse:
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    _verify_member_workspace(db, memberId, workspace_id)

    res = list_member_measurements(
        db,
        family_member_id=memberId,
        workspace_id=workspace_id,
        normalized_test_key=test_key,
    )

    record_audit_event(
        db=db,
        action="read_measurements",
        outcome="success",
        actor_user_id=current_user.user_id,
        workspace_id=workspace_id,
        metadata={"count": res.total, "test_key": test_key},
    )

    return res


@router.get(
    "/family-members/{memberId}/analytes",
    response_model=AnalyteListResponse,
    summary="List tracked analytes and biomarker summary stats for a family member",
)
def get_member_analytes(
    request: Request,
    memberId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyteListResponse:
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    _verify_member_workspace(db, memberId, workspace_id)

    return list_member_analytes(
        db,
        family_member_id=memberId,
        workspace_id=workspace_id,
    )


@router.get(
    "/family-members/{memberId}/trends",
    response_model=MeasurementTrendSeries,
    summary="Get longitudinal trend series for an analyte",
)
def get_member_trends(
    request: Request,
    memberId: uuid.UUID,
    test_key: str = Query(..., alias="test_key"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeasurementTrendSeries:
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    _verify_member_workspace(db, memberId, workspace_id)

    trend = get_member_measurement_trends(
        db,
        family_member_id=memberId,
        normalized_test_key=test_key,
        workspace_id=workspace_id,
    )

    record_audit_event(
        db=db,
        action="read_trends",
        outcome="success",
        actor_user_id=current_user.user_id,
        workspace_id=workspace_id,
        metadata={"points_count": len(trend.points), "is_comparable": trend.is_comparable},
    )

    return trend


@router.get(
    "/documents/{documentId}/measurements",
    response_model=MeasurementListResponse,
    summary="List structured measurements extracted from a specific document",
)
def get_document_measurements(
    request: Request,
    documentId: uuid.UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeasurementListResponse:
    workspace_id = get_user_workspace_id(db, current_user.user_id)
    res = list_document_measurements(
        db,
        document_id=documentId,
        workspace_id=workspace_id,
    )

    return res
