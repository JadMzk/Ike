"""Verify Supabase-issued JWTs (HS256 legacy + ES256/RS256 via JWKS)."""

import ssl
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Optional

import certifi
import jwt
from jwt import PyJWKClient, PyJWTError

from app.config import settings

_HS256 = "HS256"
_ASYMMETRIC_ALGS = frozenset({"ES256", "RS256"})


@dataclass(frozen=True)
class AuthUser:
    """Claims extracted from a valid Supabase access token."""

    id: str  # auth.users UUID (sub)
    email: Optional[str]


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    if not settings.SUPABASE_URL:
        raise RuntimeError(
            "SUPABASE_URL is not configured (required for ES256/RS256 JWT verification)"
        )
    base = settings.SUPABASE_URL.rstrip("/")
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    return PyJWKClient(
        f"{base}/auth/v1/.well-known/jwks.json",
        ssl_context=ssl_context,
    )


def _decode_payload(token: str) -> dict[str, Any]:
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", _HS256)

    if alg == _HS256:
        if not settings.SUPABASE_JWT_SECRET:
            raise RuntimeError("SUPABASE_JWT_SECRET is not configured")
        key: Any = settings.SUPABASE_JWT_SECRET
    elif alg in _ASYMMETRIC_ALGS:
        key = _jwks_client().get_signing_key_from_jwt(token).key
    else:
        raise ValueError(f"Unsupported token algorithm: {alg}")

    try:
        return jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
        )
    except PyJWTError as err:
        raise ValueError("Invalid or expired token") from err


def decode_supabase_access_token(token: str) -> AuthUser:
    """Validate a Supabase access token (legacy HS256 or JWKS-signed)."""
    payload = _decode_payload(token)

    sub = payload.get("sub")
    if not sub:
        raise ValueError("Token missing subject")

    email = payload.get("email")
    if isinstance(email, str):
        email = email.strip().lower() or None
    else:
        email = None

    return AuthUser(id=str(sub), email=email)
