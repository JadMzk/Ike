"""Auth API responses."""

from pydantic import BaseModel

from app.schemas.profile_schema import ProfileRead


class AuthSyncResponse(BaseModel):
    profile: ProfileRead
    created: bool
