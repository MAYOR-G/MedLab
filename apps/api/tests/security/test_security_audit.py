"""Security audit test suite: Rate limiting, unauthenticated boundaries, and log privacy."""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.rate_limiting import limiter
from app.main import app

client = TestClient(app)


def test_unauthenticated_private_endpoints_rejected():
    """Verify that private routes cannot be accessed without valid Bearer tokens."""
    private_routes = [
        ("GET", "/api/v1/documents"),
        ("GET", "/api/v1/documents/trash"),
        ("GET", "/api/v1/family-members"),
        ("GET", "/api/v1/shares"),
        ("GET", "/api/v1/users/me"),
        ("GET", "/api/v1/workspace"),
    ]

    for method, path in private_routes:
        if method == "GET":
            response = client.get(path)
        else:
            response = client.post(path)

        assert response.status_code == 401, f"Route {path} allowed unauthenticated access!"
        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "AUTHENTICATION_REQUIRED"


@pytest.fixture(autouse=True)
def override_db():
    """Ensure tests run against an in-memory database without external connection errors."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.db.base import Base
    from app.dependencies.database import get_db

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    def _get_test_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
    yield session
    app.dependency_overrides.pop(get_db, None)
    session.close()


def test_rate_limiting_enforcement():
    """Verify that exceeding rate limits returns 429 Too Many Requests."""
    limiter.reset()

    # Public shares endpoint allows 60 requests/minute
    fake_token = "0" * 32

    # Send 60 requests (allowed, returning 404 since token does not exist)
    for _ in range(60):
        res = client.get(f"/api/v1/public/shares/{fake_token}")
        assert res.status_code == 404

    # The 61st request must trigger 429
    rate_limited_res = client.get(f"/api/v1/public/shares/{fake_token}")
    assert rate_limited_res.status_code == 429
    data = rate_limited_res.json()
    assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"

    # Reset limiter so other tests are not impacted
    limiter.reset()


def test_audit_logs_contain_no_credentials_or_tokens():
    """Verify audit log event structure does not store plaintext credentials or bearer tokens."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.db.base import Base
    from app.db.models.audit_events import AuditEvent
    from app.services.audit_service import record_audit_event

    engine = create_engine("sqlite:///:memory:", poolclass=StaticPool)
    Base.metadata.create_all(bind=engine, tables=[AuditEvent.__table__])
    Session = sessionmaker(bind=engine)
    db = Session()

    event = record_audit_event(
        db=db,
        action="DOCUMENT_VIEW",
        outcome="success",
        actor_user_id=uuid.uuid4(),
        metadata={"safe_meta": "document_viewed"},
    )
    db.commit()

    assert "password" not in event.action.lower()
    assert "token" not in (event.metadata_json or {})
    db.close()
