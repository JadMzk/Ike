"""Business logic around tasks, including dynamic priority computation."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.dao.task_dao import TaskDAO
from app.models.task_model import Task
from app.schemas.task_schema import PriorityLevel, TaskCreate, TaskUpdate


# Constants for priority bucketing.
_PRIORITY_THRESHOLDS: list[tuple[float, PriorityLevel]] = [
    (25.0, "low"),
    (50.0, "medium"),
    (75.0, "high"),
    (100.0001, "critical"),  # upper bound is inclusive of 100
]


class TaskService:
    # ------------------------------------------------------------------ CRUD

    @staticmethod
    def create_task(db: Session, user_id: int, payload: TaskCreate) -> Task:
        return TaskDAO.create_task(
            db,
            user_id=user_id,
            name=payload.name,
            importance_score=payload.importance_score,
            initial_urgency_score=payload.initial_urgency_score,
            urgency_growth_rate=payload.urgency_growth_rate,
        )

    @staticmethod
    def get_task(db: Session, task_id: int) -> Optional[Task]:
        return TaskDAO.get_task_by_id(db, task_id)

    @staticmethod
    def get_user_tasks(
        db: Session, user_id: int, *, include_completed: bool = False
    ) -> list[Task]:
        return TaskDAO.get_tasks_by_user(
            db, user_id, include_completed=include_completed
        )

    @staticmethod
    def update_task(db: Session, task_id: int, payload: TaskUpdate) -> Optional[Task]:
        task = TaskDAO.get_task_by_id(db, task_id)
        if task is None:
            return None
        # exclude_unset → only fields the client actually sent are applied.
        return TaskDAO.update_task(db, task, payload.model_dump(exclude_unset=True))

    @staticmethod
    def complete_task(db: Session, task_id: int) -> Optional[Task]:
        """Mark a task as completed (idempotent)."""
        task = TaskDAO.get_task_by_id(db, task_id)
        if task is None:
            return None
        if task.completed:
            return task  # already done — no-op
        return TaskDAO.mark_completed(db, task)

    @staticmethod
    def delete_task(db: Session, task_id: int) -> bool:
        task = TaskDAO.get_task_by_id(db, task_id)
        if task is None:
            return False
        TaskDAO.delete_task(db, task)
        return True

    # -------------------------------------------------------- Dynamic scoring

    @staticmethod
    def compute_current_urgency(task: Task, now: Optional[datetime] = None) -> float:
        """current_urgency = min(10, initial + growth_rate * days_elapsed)."""
        now = now or datetime.now(timezone.utc)
        # Defensive: created_at coming from Postgres is tz-aware, but be safe.
        created_at = task.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        days_elapsed = max(0.0, (now - created_at).total_seconds() / 86_400.0)
        urgency = task.initial_urgency_score + task.urgency_growth_rate * days_elapsed
        return min(10.0, urgency)

    @staticmethod
    def compute_priority_score(task: Task, now: Optional[datetime] = None) -> float:
        """priority_score = importance * current_urgency  (range 0..100)."""
        return task.importance_score * TaskService.compute_current_urgency(task, now)

    @staticmethod
    def get_priority_level(priority_score: float) -> PriorityLevel:
        for upper, label in _PRIORITY_THRESHOLDS:
            if priority_score < upper:
                return label
        return "critical"
