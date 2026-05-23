"""Verify Supabase-issued JWTs (no custom session logic)."""

from dataclasses import dataclass
from typing import Any, Optional

import jwt
from jwt import PyJWTError

from app.config import settings


@dataclass(frozen=True)
class AuthUser:
    """Claims extracted from a valid Supabase access token."""

    id: str  # auth.users UUID (sub)
    email: Optional[str]


def decode_supabase_access_token(token: str) -> AuthUser:
    """Validate HS256 JWT signed with the project's JWT secret."""
    if not settings.SUPABASE_JWT_SECRET:
        raise RuntimeError("SUPABASE_JWT_SECRET is not configured")

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except PyJWTError as err:
        raise ValueError("Invalid or expired token") from err

    sub = payload.get("sub")
    if not sub:
        raise ValueError("Token missing subject")

    email = payload.get("email")
    if isinstance(email, str):
        email = email.strip().lower() or None
    else:
        email = None

    return AuthUser(id=str(sub), email=email)
