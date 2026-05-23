"""Data access for beta allowlist."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.allowed_email_model import AllowedEmail


class AllowedEmailDAO:
    @staticmethod
    def exists(db: Session, email: str) -> bool:
        stmt = select(AllowedEmail.email).where(AllowedEmail.email == email)
        return db.execute(stmt).scalar_one_or_none() is not None
