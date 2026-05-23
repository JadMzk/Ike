"""Data access for profiles."""

import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.profile_model import Profile


class ProfileDAO:
    @staticmethod
    def get_by_id(db: Session, profile_id: uuid.UUID) -> Optional[Profile]:
        return db.get(Profile, profile_id)

    @staticmethod
    def create(db: Session, profile_id: uuid.UUID) -> Profile:
        profile = Profile(id=profile_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
