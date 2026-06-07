"""Application profile — 1:1 with Supabase auth.users.id (UUID)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"

    # Same UUID as auth.users.id — canonical user identifier.
    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    plan_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="free", server_default="free"
    )

    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        "Task",
        back_populates="profile",
        cascade="all, delete-orphan",
    )
    category_resistances: Mapped[list["UserCategoryResistance"]] = relationship(  # noqa: F821
        "UserCategoryResistance",
        back_populates="profile",
        cascade="all, delete-orphan",
    )
