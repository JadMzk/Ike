"""Private-beta email gate."""

from sqlalchemy.orm import Session

from app.config import settings
from app.dao.allowed_email_dao import AllowedEmailDAO


class BetaService:
    @staticmethod
    def is_email_allowed(db: Session, email: str | None) -> bool:
        if settings.BETA_OPEN:
            return True
        if not email:
            return False

        normalized = email.strip().lower()
        if normalized in settings.beta_allowed_email_set:
            return True
        return AllowedEmailDAO.exists(db, normalized)
