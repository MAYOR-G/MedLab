"""Supabase Auth JWT verification and security helpers."""

import os
import ssl
import uuid
from typing import Any

import certifi
import jwt
from jwt import PyJWKClient
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.errors import AuthenticationError, InvalidTokenError

settings = get_settings()

# Ensure SSL_CERT_FILE is set for all stdlib ssl/urllib operations on macOS
os.environ.setdefault("SSL_CERT_FILE", certifi.where())


def get_ssl_context() -> ssl.SSLContext:
    """Create SSL context using certifi's trusted CA bundle."""
    try:
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


_jwks_client: PyJWKClient | None = None


def get_jwks_client() -> PyJWKClient:
    """Lazy initialize and return singleton PyJWKClient with caching and trusted SSL context."""
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(
            settings.SUPABASE_JWKS_URL,
            cache_keys=True,
            max_cached_keys=16,
            ssl_context=get_ssl_context(),
        )
    return _jwks_client


def set_jwks_client(client: PyJWKClient | None) -> None:
    """Override or reset PyJWKClient instance (useful for testing)."""
    global _jwks_client
    _jwks_client = client


class AuthenticatedUser(BaseModel):
    user_id: uuid.UUID
    email: str | None = None
    role: str = "authenticated"
    raw_claims: dict[str, Any] = {}


def verify_supabase_jwt(token: str) -> AuthenticatedUser:
    """Verify Supabase Auth JWT token and return authenticated user principal."""
    if not token:
        raise AuthenticationError("Authorization token is missing.")

    try:
        # Inspect unverified header to determine algorithm and key identification
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        if not alg:
            raise InvalidTokenError("Token header missing 'alg' parameter.")

        # In development mode with placeholder secrets and placeholder JWKS: fallback to payload validation
        if (
            settings.APP_ENV == "development"
            and settings.SUPABASE_JWT_SECRET == "jwt-secret-placeholder"
            and "your-project.supabase.co" in settings.SUPABASE_JWKS_URL
        ):
            unverified_claims = jwt.decode(token, options={"verify_signature": False})
            sub = unverified_claims.get("sub")
            if not sub:
                raise InvalidTokenError("Token missing 'sub' claim.")
            return AuthenticatedUser(
                user_id=uuid.UUID(sub),
                email=unverified_claims.get("email"),
                role=unverified_claims.get("role", "authenticated"),
                raw_claims=unverified_claims,
            )

        # Inspect unverified claims to check for audience
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        verify_aud = "aud" in unverified_claims
        decode_kwargs: dict[str, Any] = {}
        if verify_aud:
            decode_kwargs["audience"] = "authenticated"
        else:
            decode_kwargs["options"] = {"verify_aud": False}

        if alg in ("ES256", "RS256"):
            # Supabase asymmetric keys verified via JWKS endpoint
            jwks_client = get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                **decode_kwargs,
            )
        elif alg == "HS256":
            # Supabase symmetric secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                **decode_kwargs,
            )
        else:
            raise InvalidTokenError(f"Unsupported token algorithm: '{alg}'.")

        sub = payload.get("sub")
        if not sub:
            raise InvalidTokenError("Token missing 'sub' claim.")

        return AuthenticatedUser(
            user_id=uuid.UUID(sub),
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
            raw_claims=payload,
        )

    except jwt.ExpiredSignatureError as e:
        raise InvalidTokenError("Authorization token has expired.") from e
    except jwt.PyJWKClientError as e:
        raise InvalidTokenError(f"Failed to verify token with JWKS: {e}") from e
    except (jwt.InvalidTokenError, ValueError) as e:
        raise InvalidTokenError(f"Invalid authorization token: {e}") from e
