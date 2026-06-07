"""Adaptive per-category resistance learned from completion patterns."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.dao.category_resistance_dao import CategoryResistanceDAO
from app.models.task_model import Task
from app.models.user_category_resistance_model import UserCategoryResistance

DEFAULT_RESISTANCE = 0.30
MIN_RESISTANCE = 0.10
MAX_RESISTANCE = 1.50
INACTIVITY_PERIOD_DAYS = 2
INACTIVITY_INCREASE = 0.05
COMPLETION_DECREASE = 0.02
_SECONDS_PER_DAY = 86_400.0


class CategoryResistanceService:
    @staticmethod
    def _utcnow() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _ensure_aware(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    @staticmethod
    def clamp_resistance(value: float) -> float:
        return max(MIN_RESISTANCE, min(MAX_RESISTANCE, value))

    @staticmethod
    def full_days_between(start: datetime, end: datetime) -> int:
        """Whole calendar days elapsed from start to end (UTC-normalized)."""
        start = CategoryResistanceService._ensure_aware(start)
        end = CategoryResistanceService._ensure_aware(end)
        delta = end - start
        if delta.total_seconds() <= 0:
            return 0
        return int(delta.total_seconds() // _SECONDS_PER_DAY)

    @staticmethod
    def inactivity_periods(last_activity_at: datetime, now: datetime) -> int:
        """Number of complete 2-day inactivity windows since last category activity."""
        days = CategoryResistanceService.full_days_between(last_activity_at, now)
        return days // INACTIVITY_PERIOD_DAYS

    @staticmethod
    def effective_resistance(
        stored_resistance: float,
        last_activity_at: datetime,
        now: Optional[datetime] = None,
    ) -> float:
        """Apply dynamic inactivity increase without persisting it."""
        now = now or CategoryResistanceService._utcnow()
        periods = CategoryResistanceService.inactivity_periods(last_activity_at, now)
        raw = stored_resistance + periods * INACTIVITY_INCREASE
        return CategoryResistanceService.clamp_resistance(raw)

    @staticmethod
    def get_or_create(
        db: Session,
        profile_id: uuid.UUID,
        category: str,
        now: Optional[datetime] = None,
    ) -> UserCategoryResistance:
        existing = CategoryResistanceDAO.get(db, profile_id, category)
        if existing is not None:
            return existing

        now = now or CategoryResistanceService._utcnow()
        return CategoryResistanceDAO.create(
            db,
            profile_id=profile_id,
            category=category,
            resistance_factor=DEFAULT_RESISTANCE,
            last_activity_at=now,
        )

    @staticmethod
    def compute_for_task(
        db: Session, task: Task, now: Optional[datetime] = None
    ) -> float:
        """Effective resistance for effort growth (category-learned when profile-owned)."""
        if task.profile_id is None:
            # Legacy integer-user tasks — keep stored per-task value.
            return task.resistance_factor

        record = CategoryResistanceService.get_or_create(
            db, task.profile_id, task.category, now
        )
        return CategoryResistanceService.effective_resistance(
            record.resistance_factor, record.last_activity_at, now
        )

    @staticmethod
    def record_completion(
        db: Session,
        profile_id: uuid.UUID,
        category: str,
        now: Optional[datetime] = None,
    ) -> UserCategoryResistance:
        """Reward completing a task in this category."""
        now = now or CategoryResistanceService._utcnow()
        record = CategoryResistanceService.get_or_create(db, profile_id, category, now)
        record.resistance_factor = CategoryResistanceService.clamp_resistance(
            record.resistance_factor - COMPLETION_DECREASE
        )
        record.last_activity_at = now
        return CategoryResistanceDAO.save(db, record)
