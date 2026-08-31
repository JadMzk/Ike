"""Supabase Auth sync — profile creation + optional allowlist."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_auth_user
from app.auth.jwt import AuthUser
from app.database import get_db
from app.schemas.auth_schema import AuthSyncResponse
from app.schemas.profile_schema import ProfileRead
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync", response_model=AuthSyncResponse)
def sync_auth_user(
    auth_user: AuthUser = Depends(get_current_auth_user),
    db: Session = Depends(get_db),
) -> AuthSyncResponse:
    """Call once after Google sign-in.

    - Verifies the Supabase JWT (Bearer token).
    - Optionally enforces a sign-in allowlist (see ALLOWED_EMAILS / allowed_emails).
    - Creates `profiles` row on first login (id = auth.users.id).
    """
    try:
        profile, created = ProfileService.sync_profile(
            db,
            auth_user_id=auth_user.id,
            email=auth_user.email,
        )
    except ValueError as err:
        if str(err) == "sign_in_not_allowed":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sign-in is not allowed for this account on this server.",
            ) from err
        raise

    return AuthSyncResponse(
        profile=ProfileRead.model_validate(profile),
        created=created,
    )


@router.get("/me", response_model=ProfileRead)
def get_my_profile(
    auth_user: AuthUser = Depends(get_current_auth_user),
    db: Session = Depends(get_db),
) -> ProfileRead:
    profile = ProfileService.get_profile(db, auth_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Call POST /auth/sync first.",
        )
    return ProfileRead.model_validate(profile)
