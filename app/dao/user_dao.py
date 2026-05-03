"""Data-access layer for the User entity.

The DAO only knows about the DB. It does not hash passwords, validate input,
or know about HTTP — those concerns belong in the service / router layers.
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_model import User


class UserDAO:
    @staticmethod
    def create_user(db: Session, username: str, hashed_password: str) -> User:
        user = User(username=username, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.get(User, user_id)

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        stmt = select(User).where(User.username == username)
        return db.execute(stmt).scalar_one_or_none()
