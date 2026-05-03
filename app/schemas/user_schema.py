"""Pydantic schemas for the User resource."""

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    """Payload for creating a new user."""

    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6, max_length=128)


class UserRead(BaseModel):
    """Public-facing user representation (no password leaked)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
