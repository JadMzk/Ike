"""Task ORM model.

Dynamic fields (current_urgency, current_effort, priority_score) are computed
at runtime in TaskService — never stored.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, Float, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint("importance_score >= 0 AND importance_score <= 10", name="ck_tasks_importance_range"),
        CheckConstraint(
            "initial_urgency_score >= 0 AND initial_urgency_score <= 10",
            name="ck_tasks_initial_urgency_range",
        ),
        CheckConstraint("urgency_growth_rate >= 0", name="ck_tasks_growth_non_negative"),
        CheckConstraint(
            "initial_effort >= 0 AND initial_effort <= 10",
            name="ck_tasks_initial_effort_range",
        ),
        CheckConstraint("resistance_factor >= 0", name="ck_tasks_resistance_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Canonical owner — Supabase auth.users.id (profiles.id).
    profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Legacy MVP test users (integer ids). New tasks use profile_id only.
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="personal")

    importance_score: Mapped[float] = mapped_column(Float, nullable=False)
    initial_urgency_score: Mapped[float] = mapped_column(Float, nullable=False)
    urgency_growth_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    initial_effort: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
    resistance_factor: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )

    completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false", index=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    profile: Mapped[Optional["Profile"]] = relationship(  # noqa: F821
        "Profile",
        back_populates="tasks",
    )
    user: Mapped[Optional["User"]] = relationship("User", back_populates="tasks")  # noqa: F821
