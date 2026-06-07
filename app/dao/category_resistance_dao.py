"""Data access for per-category resistance records."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_category_resistance_model import UserCategoryResistance


class CategoryResistanceDAO:
    @staticmethod
    def get(
        db: Session, profile_id: uuid.UUID, category: str
    ) -> Optional[UserCategoryResistance]:
        stmt = select(UserCategoryResistance).where(
            UserCategoryResistance.profile_id == profile_id,
            UserCategoryResistance.category == category,
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def create(
        db: Session,
        *,
        profile_id: uuid.UUID,
        category: str,
        resistance_factor: float,
        last_activity_at: datetime,
    ) -> UserCategoryResistance:
        record = UserCategoryResistance(
            profile_id=profile_id,
            category=category,
            resistance_factor=resistance_factor,
            last_activity_at=last_activity_at,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def save(db: Session, record: UserCategoryResistance) -> UserCategoryResistance:
        db.commit()
        db.refresh(record)
        return record
