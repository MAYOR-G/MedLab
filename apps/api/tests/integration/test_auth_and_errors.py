"""Integration tests for Core API Infrastructure, Middleware, and Auth."""

from fastapi import Depends
from fastapi.testclient import TestClient

from app.core.security import AuthenticatedUser
from app.dependencies.auth import get_current_user
from app.main import app

client = TestClient(app)


def test_health_check_endpoint() -> None:
    """Verify /api/v1/health returns healthy status and requestId."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert data["data"]["status"] in ("healthy", "degraded")
    assert "requestId" in data
    # Security headers
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert "X-Request-ID" in response.headers


# Register protected test endpoint
@app.get("/test-protected")
def protected_endpoint(
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, str]:
    return {"user": str(user.user_id)}


def test_missing_auth_header() -> None:
    """Verify missing auth header on a protected dependency returns 401 envelope."""
    response = client.get("/test-protected")
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "AUTHENTICATION_REQUIRED"
    assert "requestId" in data


def test_invalid_auth_token() -> None:
    """Verify invalid token format returns 401 envelope."""
    response = client.get(
        "/test-protected", headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "INVALID_TOKEN"
    assert "requestId" in data


def test_request_id_propagation() -> None:
    """Verify incoming X-Request-ID header is preserved."""
    custom_id = "test-request-id-12345"
    response = client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id
    assert response.json()["requestId"] == custom_id
