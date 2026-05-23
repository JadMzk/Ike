"""Authenticated routes for the current user (Supabase JWT)."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_profile
from app.database import get_db
from app.models.profile_model import Profile
from app.schemas.task_schema import (
    PriorityLandscapePlan,
    TaskCreate,
    TaskUpdate,
    TaskWithDynamics,
)
from app.services.priority_landscape_service import PriorityLandscapeService
from app.services.task_service import TaskService

router = APIRouter(prefix="/me", tags=["me"])


def _to_dynamic(task) -> TaskWithDynamics:
    urgency = TaskService.compute_current_urgency(task)
    effort = TaskService.compute_current_effort(task)
    priority = TaskService.compute_priority_score(task)
    level = TaskService.get_priority_level(priority)
    return TaskWithDynamics(
        id=task.id,
        profile_id=task.profile_id,
        user_id=task.user_id,
        name=task.name,
        category=task.category,
        importance_score=task.importance_score,
        initial_urgency_score=task.initial_urgency_score,
        urgency_growth_rate=task.urgency_growth_rate,
        initial_effort=task.initial_effort,
        resistance_factor=task.resistance_factor,
        created_at=task.created_at,
        completed=task.completed,
        completed_at=task.completed_at,
        current_urgency=urgency,
        current_effort=effort,
        priority_score=priority,
        priority_level=level,
    )


def _require_owned_task(
    db: Session, task_id: int, profile: Profile
):
    task = TaskService.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if not TaskService.task_belongs_to_profile(task, profile):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your task")
    return task


@router.get("/tasks", response_model=list[TaskWithDynamics])
def list_my_tasks(
    include_completed: bool = False,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> list[TaskWithDynamics]:
    return [
        _to_dynamic(t)
        for t in TaskService.get_profile_tasks(
            db, profile, include_completed=include_completed
        )
    ]


@router.post("/tasks", response_model=TaskWithDynamics, status_code=status.HTTP_201_CREATED)
def create_my_task(
    payload: TaskCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> TaskWithDynamics:
    task = TaskService.create_task_for_profile(db, profile, payload)
    return _to_dynamic(task)


@router.get("/priority-landscape", response_model=PriorityLandscapePlan)
def get_my_priority_landscape(
    motivation_score: Optional[int] = Query(None, ge=1, le=10),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
) -> PriorityLandscapePlan:
    return PriorityLandscapeService.get_profile_plan(
        db, profile, motivation_score=motivation_score
    )
