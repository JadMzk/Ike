"""Per-profile learned resistance by task category."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserCategoryResistance(Base):
    __tablename__ = "user_category_resistance"
    __table_args__ = (
        UniqueConstraint("profile_id", "category", name="uq_user_category_resistance"),
        CheckConstraint(
            "resistance_factor >= 0.10 AND resistance_factor <= 1.50",
            name="ck_user_category_resistance_bounds",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    resistance_factor: Mapped[float] = mapped_column(Float, nullable=False, default=0.30)
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    profile: Mapped["Profile"] = relationship(  # noqa: F821
        "Profile",
        back_populates="category_resistances",
    )
