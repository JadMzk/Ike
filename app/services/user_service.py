"""Business logic around users.

Note: for the MVP we use SHA-256 to hash the password. For production use a
slow KDF such as bcrypt or argon2 (e.g. via passlib).
"""

import hashlib
from typing import Optional

from sqlalchemy.orm import Session

from app.dao.user_dao import UserDAO
from app.models.user_model import User
from app.schemas.user_schema import UserCreate


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class UserService:
    @staticmethod
    def create_user(db: Session, payload: UserCreate) -> User:
        if UserDAO.get_user_by_username(db, payload.username) is not None:
            raise ValueError(f"Username '{payload.username}' is already taken")

        return UserDAO.create_user(
            db,
            username=payload.username,
            hashed_password=_hash_password(payload.password),
        )

    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        return UserDAO.get_user_by_id(db, user_id)
