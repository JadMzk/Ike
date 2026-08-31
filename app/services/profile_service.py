"""Profile lifecycle tied to Supabase Auth."""

import uuid

from sqlalchemy.orm import Session

from app.dao.profile_dao import ProfileDAO
from app.models.profile_model import Profile
from app.services.access_service import AccessService


class ProfileService:
    @staticmethod
    def get_profile(db: Session, profile_id: str | uuid.UUID) -> Profile | None:
        pid = profile_id if isinstance(profile_id, uuid.UUID) else uuid.UUID(profile_id)
        return ProfileDAO.get_by_id(db, pid)

    @staticmethod
    def sync_profile(
        db: Session,
        *,
        auth_user_id: str,
        email: str | None,
    ) -> tuple[Profile, bool]:
        """Ensure profile exists. Returns (profile, created).

        Raises ValueError if email is not on the sign-in allowlist.
        """
        if not AccessService.is_email_allowed(db, email):
            raise ValueError("sign_in_not_allowed")

        pid = uuid.UUID(auth_user_id)
        existing = ProfileDAO.get_by_id(db, pid)
        if existing is not None:
            return existing, False
        return ProfileDAO.create(db, pid), True
