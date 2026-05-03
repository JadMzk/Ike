"""HTTP routes for the Task resource and the Eisenhower plan."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.task_schema import (
    EisenhowerPlan,
    TaskCreate,
    TaskUpdate,
    TaskWithDynamics,
)
from app.services.eisenhower_service import EisenhowerService
from app.services.task_service import TaskService
from app.services.user_service import UserService


router = APIRouter(tags=["tasks"])


def _to_dynamic(task) -> TaskWithDynamics:
    """Enrich a stored Task with its computed urgency / priority fields."""
    urgency = TaskService.compute_current_urgency(task)
    priority = task.importance_score * urgency
    level = TaskService.get_priority_level(priority)
    return TaskWithDynamics(
        id=task.id,
        user_id=task.user_id,
        name=task.name,
        importance_score=task.importance_score,
        initial_urgency_score=task.initial_urgency_score,
        urgency_growth_rate=task.urgency_growth_rate,
        created_at=task.created_at,
        current_urgency=urgency,
        priority_score=priority,
        priority_level=level,
    )


# ------------------------------------------------------------------ Task CRUD


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
    """Create a task. `user_id` is passed as a query param for the MVP
    (replace with auth-derived current_user once authentication exists).
    """
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


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)) -> None:
    if not TaskService.delete_task(db, task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


# ----------------------------------------------------------- User-scoped lists


@router.get("/users/{user_id}/tasks", response_model=list[TaskWithDynamics])
def list_user_tasks(user_id: int, db: Session = Depends(get_db)) -> list[TaskWithDynamics]:
    if UserService.get_user(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return [_to_dynamic(t) for t in TaskService.get_user_tasks(db, user_id)]


@router.get("/users/{user_id}/eisenhower-plan", response_model=EisenhowerPlan)
def get_eisenhower_plan(user_id: int, db: Session = Depends(get_db)) -> EisenhowerPlan:
    if UserService.get_user(db, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return EisenhowerService.get_user_plan(db, user_id)
