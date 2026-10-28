"""Authentication dependency for FastAPI request lifecycle."""

from fastapi import Depends, Header

from app.core.errors import AuthenticationError
from app.core.security import AuthenticatedUser, verify_supabase_jwt


def get_current_user(
    authorization: str | None = Header(None, alias="Authorization"),
) -> AuthenticatedUser:
    """Extract and verify Bearer token from the HTTP Authorization header."""
    if not authorization:
        raise AuthenticationError("Authorization header is missing.")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError("Authorization header must use Bearer scheme.")

    token = parts[1]
    return verify_supabase_jwt(token)


CurrentUser = Depends(get_current_user)
