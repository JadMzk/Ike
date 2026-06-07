"""Task routes by id (JWT required — ownership enforced)."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_profile
from app.database import get_db
from app.models.profile_model import Profile
from app.routers.me_router import _require_owned_task, _to_dynamic
from app.schemas.task_schema import (
    PriorityLandscapePlan,
    TaskCreate,
    TaskUpdate,
    TaskWithDynamics,
)
from app.services.priority_landscape_service import PriorityLandscapeService
from app.services.task_service import TaskService
from app.services.user_service import UserService

router = APIRouter(tags=["tasks"])


@router.get("/tasks/{task_id}", response_model=TaskWithDynamics)
def get_task(
    task_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> TaskWithDynamics:
    task = _require_owned_task(db, task_id, profile)
    return _to_dynamic(db, task)


@router.patch("/tasks/{task_id}", response_model=TaskWithDynamics)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> TaskWithDynamics:
    task = _require_owned_task(db, task_id, profile)
    updated = TaskService.update_task(db, task_id, payload)
    assert updated is not None
    return _to_dynamic(db, updated)


@router.patch("/tasks/{task_id}/complete", response_model=TaskWithDynamics)
def complete_task(
    task_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> TaskWithDynamics:
    _require_owned_task(db, task_id, profile)
    task = TaskService.complete_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return _to_dynamic(db, task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> None:
    _require_owned_task(db, task_id, profile)
    if not TaskService.delete_task(db, task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


# ------------------------------------------------------------------ Legacy (pre-auth MVP)


@router.post(
    "/tasks",
    response_model=TaskWithDynamics,
    status_code=status.HTTP_201_CREATED,
    deprecated=True,
    tags=["legacy"],
)
def create_task_legacy(
    payload: TaskCreate,
    user_id: int,
    db: Session = Depends(get_db),
) -> TaskWithDynamics:
    if UserService.get_user(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    task = TaskService.create_task(db, user_id, payload)
    return _to_dynamic(db, task)


@router.get(
    "/users/{user_id}/tasks",
    response_model=list[TaskWithDynamics],
    deprecated=True,
    tags=["legacy"],
)
def list_user_tasks(
    user_id: int,
    include_completed: bool = False,
    db: Session = Depends(get_db),
) -> list[TaskWithDynamics]:
    if UserService.get_user(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return [
        _to_dynamic(db, t)
        for t in TaskService.get_user_tasks(
            db, user_id, include_completed=include_completed
        )
    ]


@router.get(
    "/users/{user_id}/priority-landscape",
    response_model=PriorityLandscapePlan,
    deprecated=True,
    tags=["legacy"],
)
def get_priority_landscape(
    user_id: int,
    motivation_score: Optional[int] = Query(None, ge=1, le=10),
    db: Session = Depends(get_db),
) -> PriorityLandscapePlan:
    if UserService.get_user(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return PriorityLandscapeService.get_user_plan(
        db, user_id, motivation_score=motivation_score
    )
