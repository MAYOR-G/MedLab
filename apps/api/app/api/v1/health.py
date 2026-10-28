"""Health check endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.errors import get_request_id
from app.dependencies.database import get_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=dict[str, Any])
def check_health(request: Request, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Verify application and database health."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {e}"

    req_id = get_request_id(request)
    return {
        "data": {
            "status": "healthy" if db_status == "connected" else "degraded",
            "database": db_status,
        },
        "requestId": req_id,
    }
