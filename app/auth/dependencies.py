"""FastAPI dependencies for Supabase-authenticated requests."""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.jwt import AuthUser, decode_supabase_access_token
from app.database import get_db
from app.models.profile_model import Profile
from app.services.profile_service import ProfileService

_bearer = HTTPBearer(auto_error=False)


def get_optional_auth_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[AuthUser]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    try:
        return decode_supabase_access_token(credentials.credentials)
    except (ValueError, RuntimeError):
        return None


def get_current_auth_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> AuthUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return decode_supabase_access_token(credentials.credentials)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(err),
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except RuntimeError as err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(err),
        ) from err


def get_current_profile(
    auth_user: AuthUser = Depends(get_current_auth_user),
    db: Session = Depends(get_db),
) -> Profile:
    profile = ProfileService.get_profile(db, auth_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profile not found. Call POST /auth/sync after sign-in.",
        )
    return profile
