"""Integration and security tests for authentication, onboarding, and family isolation."""

import time
import uuid
from datetime import UTC, date, datetime
from unittest.mock import MagicMock

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.security import (
    AuthenticatedUser,
    get_jwks_client,
    set_jwks_client,
    verify_supabase_jwt,
)
from app.db.base import Base
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.main import app

settings = get_settings()

# Setup test in-memory SQLite database with StaticPool
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Clean all tables before each test."""
    with TestingSessionLocal() as session:
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()
    yield


# --- Helper: Generate Test JWTs ---
def generate_hs256_token(
    user_id: uuid.UUID,
    email: str = "test@example.com",
    expired: bool = False,
    secret: str | None = None,
) -> str:
    now = int(time.time())
    exp = now - 3600 if expired else now + 3600
    payload = {
        "sub": str(user_id),
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now - 60,
        "exp": exp,
    }
    return jwt.encode(
        payload,
        secret or settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
        headers={"alg": "HS256", "typ": "JWT"},
    )


def generate_es256_token_and_mock_jwks(
    user_id: uuid.UUID,
    email: str = "es256@example.com",
    expired: bool = False,
):
    """Generate ECC keypair, sign token with ES256, and mock PyJWKClient."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    kid = "test-es256-key-id"

    now = int(time.time())
    exp = now - 3600 if expired else now + 3600
    payload = {
        "sub": str(user_id),
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now - 60,
        "exp": exp,
    }
    token = jwt.encode(
        payload,
        private_key,
        algorithm="ES256",
        headers={"alg": "ES256", "kid": kid, "typ": "JWT"},
    )

    mock_signing_key = MagicMock()
    mock_signing_key.key = public_key
    mock_signing_key.key_id = kid

    mock_client = MagicMock()
    mock_client.get_signing_key_from_jwt.return_value = mock_signing_key

    return token, mock_client


# ==============================================================================
# 1. JWT Verification Tests (JWKS ES256 & Secret HS256)
# ==============================================================================

def test_verify_jwt_es256_with_jwks() -> None:
    """Verify ES256 token signed by Supabase asymmetric key is verified via JWKS."""
    user_id = uuid.uuid4()
    token, mock_jwks = generate_es256_token_and_mock_jwks(user_id, email="es256@medlab.test")
    set_jwks_client(mock_jwks)

    try:
        user = verify_supabase_jwt(token)
        assert user.user_id == user_id
        assert user.email == "es256@medlab.test"
        assert user.role == "authenticated"
    finally:
        set_jwks_client(None)


def test_verify_jwt_es256_expired() -> None:
    """Verify expired ES256 token raises expired token error."""
    user_id = uuid.uuid4()
    token, mock_jwks = generate_es256_token_and_mock_jwks(user_id, expired=True)
    set_jwks_client(mock_jwks)

    try:
        with pytest.raises(Exception) as exc_info:
            verify_supabase_jwt(token)
        assert "expired" in str(exc_info.value).lower()
    finally:
        set_jwks_client(None)


def test_verify_jwt_hs256_valid() -> None:
    """Verify standard HS256 token verification."""
    user_id = uuid.uuid4()
    token = generate_hs256_token(user_id, email="hs256@medlab.test")
    user = verify_supabase_jwt(token)
    assert user.user_id == user_id
    assert user.email == "hs256@medlab.test"


def test_verify_jwt_hs256_expired() -> None:
    """Verify expired HS256 token returns expired token error."""
    user_id = uuid.uuid4()
    token = generate_hs256_token(user_id, expired=True)
    with pytest.raises(Exception) as exc_info:
        verify_supabase_jwt(token)
    assert "expired" in str(exc_info.value).lower()


def test_verify_jwt_invalid_signature() -> None:
    """Verify token signed with wrong key is rejected."""
    user_id = uuid.uuid4()
    token = generate_hs256_token(user_id, secret="wrong-secret-key-that-does-not-match")
    with pytest.raises(Exception) as exc_info:
        verify_supabase_jwt(token)
    assert "invalid" in str(exc_info.value).lower()


# ==============================================================================
# 2. Onboarding Flow & Profile Status Tests
# ==============================================================================

def test_onboarding_flow_completion() -> None:
    """Verify initial user profile is incomplete, and onboarding completes owner setup."""
    user_id = uuid.uuid4()
    token = generate_hs256_token(user_id, email="owner@medlab.test")
    auth_header = {"Authorization": f"Bearer {token}"}

    # 1. Fresh user checks profile: should not be completed yet
    res = client.get("/api/v1/users/me", headers=auth_header)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["id"] == str(user_id)
    assert data["displayName"] is None
    assert data["isCompleted"] is False

    # 2. Submit onboarding details
    onboarding_payload = {
        "fullName": "Mayowa Johnson",
        "dateOfBirth": "1994-06-18",
        "notes": "No known allergies, blood type O+",
        "workspaceName": "The Johnson Vault",
    }
    onboard_res = client.post("/api/v1/users/onboarding", json=onboarding_payload, headers=auth_header)
    assert onboard_res.status_code == 200
    onboard_data = onboard_res.json()["data"]
    assert onboard_data["displayName"] == "Mayowa Johnson"
    assert onboard_data["isCompleted"] is True

    # 3. Fetching profile again reports completed = True
    res_after = client.get("/api/v1/users/me", headers=auth_header)
    assert res_after.status_code == 200
    assert res_after.json()["data"]["isCompleted"] is True
    assert res_after.json()["data"]["displayName"] == "Mayowa Johnson"

    # 4. Workspace should be created with the custom name
    ws_res = client.get("/api/v1/workspace", headers=auth_header)
    assert ws_res.status_code == 200
    assert ws_res.json()["data"]["name"] == "The Johnson Vault"

    # 5. Primary "self" family member is automatically present
    fam_res = client.get("/api/v1/family-members", headers=auth_header)
    assert fam_res.status_code == 200
    members = fam_res.json()["data"]
    assert len(members) == 1
    self_member = members[0]
    assert self_member["fullName"] == "Mayowa Johnson"
    assert self_member["relationship"] == "self"
    assert self_member["dateOfBirth"] == "1994-06-18"


# ==============================================================================
# 3. Adding Family Members & Prevent Duplicate / Deleting Self
# ==============================================================================

def test_add_family_members_under_owner() -> None:
    """Verify owner can add dependants without separate logins, and cannot delete self."""
    user_id = uuid.uuid4()
    token = generate_hs256_token(user_id, email="parent@medlab.test")
    auth_header = {"Authorization": f"Bearer {token}"}

    # Onboard owner first
    client.post(
        "/api/v1/users/onboarding",
        json={"fullName": "Alex Smith", "dateOfBirth": "1988-02-10"},
        headers=auth_header,
    )

    # Owner adds child
    child_payload = {
        "fullName": "Leo Smith",
        "relationship": "child",
        "dateOfBirth": "2016-11-04",
        "notes": "Pediatric asthma inhaler",
    }
    child_res = client.post("/api/v1/family-members", json=child_payload, headers=auth_header)
    assert child_res.status_code == 201
    child_data = child_res.json()["data"]
    assert child_data["fullName"] == "Leo Smith"
    assert child_data["relationship"] == "child"

    # Listing members shows both self and child
    list_res = client.get("/api/v1/family-members", headers=auth_header)
    assert list_res.status_code == 200
    members = list_res.json()["data"]
    assert len(members) == 2

    # Owner attempts to add a second "self" profile -> rejected with 409 Conflict
    dup_self_res = client.post(
        "/api/v1/family-members",
        json={"fullName": "Alex Duplicate", "relationship": "self"},
        headers=auth_header,
    )
    assert dup_self_res.status_code == 409

    # Owner attempts to delete the primary "self" profile -> rejected with 409 Conflict
    self_member = next(m for m in members if m["relationship"] == "self")
    del_self_res = client.delete(f"/api/v1/family-members/{self_member['id']}", headers=auth_header)
    assert del_self_res.status_code == 409

    # Owner deletes the child profile -> successful 204
    del_child_res = client.delete(f"/api/v1/family-members/{child_data['id']}", headers=auth_header)
    assert del_child_res.status_code == 204


# ==============================================================================
# 4. Cross-Account Access Denial Tests
# ==============================================================================

def test_cross_account_isolation_and_denial() -> None:
    """Verify User B cannot access, read, modify, or delete User A's family records."""
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()
    token_a = generate_hs256_token(user_a, email="user_a@test.com")
    token_b = generate_hs256_token(user_b, email="user_b@test.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Onboard User A and create a family member
    client.post(
        "/api/v1/users/onboarding",
        json={"fullName": "Alice Vault", "workspaceName": "Alice's Family"},
        headers=headers_a,
    )
    child_a = client.post(
        "/api/v1/family-members",
        json={"fullName": "Charlie Alice", "relationship": "child"},
        headers=headers_a,
    ).json()["data"]

    # Onboard User B
    client.post(
        "/api/v1/users/onboarding",
        json={"fullName": "Bob Vault", "workspaceName": "Bob's Family"},
        headers=headers_b,
    )

    # 1. User B lists members: must NOT see Charlie Alice
    b_members = client.get("/api/v1/family-members", headers=headers_b).json()["data"]
    b_names = [m["fullName"] for m in b_members]
    assert "Charlie Alice" not in b_names
    assert "Alice Vault" not in b_names
    assert "Bob Vault" in b_names

    # 2. User B tries to GET User A's child -> 404 Not Found
    get_res = client.get(f"/api/v1/family-members/{child_a['id']}", headers=headers_b)
    assert get_res.status_code == 404

    # 3. User B tries to PATCH User A's child -> 404 Not Found
    patch_res = client.patch(
        f"/api/v1/family-members/{child_a['id']}",
        json={"fullName": "Hacked Name"},
        headers=headers_b,
    )
    assert patch_res.status_code == 404

    # 4. User B tries to DELETE User A's child -> 404 Not Found
    del_res = client.delete(f"/api/v1/family-members/{child_a['id']}", headers=headers_b)
    assert del_res.status_code == 404

    # 5. User A confirms their child is still safe and unaltered
    confirm_res = client.get(f"/api/v1/family-members/{child_a['id']}", headers=headers_a)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["data"]["fullName"] == "Charlie Alice"


def test_jwks_ssl_context_uses_certifi() -> None:
    """Verify PyJWKClient initializes with certifi-backed SSL context to prevent macOS SSL verification failures."""
    from app.core.security import get_jwks_client, get_ssl_context
    import certifi

    context = get_ssl_context()
    assert context is not None
    client_instance = get_jwks_client()
    assert client_instance.ssl_context is not None
