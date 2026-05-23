"""HTTP routes for the User resource."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user_schema import UserCreate, UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_410_GONE,
    deprecated=True,
)
def create_user(_payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    """Password signup removed — use Supabase Google OAuth."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Password signup is disabled. Sign in with Google via the mobile app.",
    )


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)) -> UserRead:
    user = UserService.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserRead.model_validate(user)
