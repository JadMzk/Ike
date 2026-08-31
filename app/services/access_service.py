"""Optional email allowlist for sign-in."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.dao.allowed_email_dao import AllowedEmailDAO
from app.models.allowed_email_model import AllowedEmail


class AccessService:
    @staticmethod
    def allowlist_enabled(db: Session) -> bool:
        if settings.allowed_email_set:
            return True
        stmt = select(func.count()).select_from(AllowedEmail)
        return (db.execute(stmt).scalar_one() or 0) > 0

    @staticmethod
    def is_email_allowed(db: Session, email: str | None) -> bool:
        if not AccessService.allowlist_enabled(db):
            return True
        if not email:
            return False

        normalized = email.strip().lower()
        if normalized in settings.allowed_email_set:
            return True
        return AllowedEmailDAO.exists(db, normalized)
