"""HTTP routes for the Task resource and the priority landscape."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
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


def _to_dynamic(task) -> TaskWithDynamics:
    urgency = TaskService.compute_current_urgency(task)
    effort = TaskService.compute_current_effort(task)
    priority = TaskService.compute_priority_score(task)
    level = TaskService.get_priority_level(priority)
    return TaskWithDynamics(
        id=task.id,
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


@router.post(
    "/tasks",
    response_model=TaskWithDynamics,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    payload: TaskCreate,
    user_id: int,
    db: Session = Depends(get_db),
) -> TaskWithDynamics:
    if UserService.get_user(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    task = TaskService.create_task(db, user_id, payload)
    return _to_dynamic(task)


@router.get("/tasks/{task_id}", response_model=TaskWithDynamics)
def get_task(task_id: int, db: Session = Depends(get_db)) -> TaskWithDynamics:
    task = TaskService.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return _to_dynamic(task)


@router.patch("/tasks/{task_id}", response_model=TaskWithDynamics)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
) -> TaskWithDynamics:
    task = TaskService.update_task(db, task_id, payload)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return _to_dynamic(task)


@router.patch("/tasks/{task_id}/complete", response_model=TaskWithDynamics)
def complete_task(task_id: int, db: Session = Depends(get_db)) -> TaskWithDynamics:
    task = TaskService.complete_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return _to_dynamic(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)) -> None:
    if not TaskService.delete_task(db, task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.get("/users/{user_id}/tasks", response_model=list[TaskWithDynamics])
def list_user_tasks(
    user_id: int,
    include_completed: bool = False,
    db: Session = Depends(get_db),
) -> list[TaskWithDynamics]:
    if UserService.get_user(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return [
        _to_dynamic(t)
        for t in TaskService.get_user_tasks(
            db, user_id, include_completed=include_completed
        )
    ]


@router.get("/users/{user_id}/priority-landscape", response_model=PriorityLandscapePlan)
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
