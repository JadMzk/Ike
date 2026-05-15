"""Business logic around tasks, including dynamic priority computation."""

import math
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.dao.task_dao import TaskDAO
from app.models.task_model import Task
from app.schemas.task_schema import PriorityLevel, TaskCreate, TaskUpdate


_PRIORITY_THRESHOLDS: list[tuple[float, PriorityLevel]] = [
    (25.0, "low"),
    (50.0, "medium"),
    (75.0, "high"),
    (90.0, "critical"),
]

_SECONDS_PER_DAY = 86_400.0


class TaskService:
    # ------------------------------------------------------------------ CRUD

    @staticmethod
    def create_task(db: Session, user_id: int, payload: TaskCreate) -> Task:
        return TaskDAO.create_task(
            db,
            user_id=user_id,
            name=payload.name,
            category=payload.category,
            importance_score=payload.importance_score,
            initial_urgency_score=payload.initial_urgency_score,
            urgency_growth_rate=payload.urgency_growth_rate,
            initial_effort=payload.initial_effort,
            resistance_factor=payload.resistance_factor,
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
        return TaskDAO.update_task(db, task, payload.model_dump(exclude_unset=True))

    @staticmethod
    def complete_task(db: Session, task_id: int) -> Optional[Task]:
        task = TaskDAO.get_task_by_id(db, task_id)
        if task is None:
            return None
        if task.completed:
            return task
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
    def _days_elapsed(task: Task, now: datetime) -> float:
        created_at = task.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        return max(0.0, (now - created_at).total_seconds() / _SECONDS_PER_DAY)

    @staticmethod
    def compute_current_urgency(task: Task, now: Optional[datetime] = None) -> float:
        """current_urgency = min(10, initial + growth_rate * days_elapsed)."""
        now = now or datetime.now(timezone.utc)
        days = TaskService._days_elapsed(task, now)
        urgency = task.initial_urgency_score + task.urgency_growth_rate * days
        return min(10.0, urgency)

    @staticmethod
    def compute_resistance_factor(task: Task) -> float:
        """Effective resistance for effort growth.

        MVP: returns the stored value. Future: increase when the user
        historically delays tasks in the same category.
        """
        # TODO(category-learning): look up per-user category delay stats.
        return task.resistance_factor

    @staticmethod
    def compute_current_effort(task: Task, now: Optional[datetime] = None) -> float:
        """current_effort = min(10, initial_effort + resistance * sqrt(days_elapsed))."""
        now = now or datetime.now(timezone.utc)
        resistance = TaskService.compute_resistance_factor(task)
        days = TaskService._days_elapsed(task, now)
        effort = task.initial_effort + resistance * math.sqrt(days)
        return min(10.0, effort)

    @staticmethod
    def compute_priority_score(task: Task, now: Optional[datetime] = None) -> float:
        """priority_score = importance * current_urgency  (range 0..100)."""
        return task.importance_score * TaskService.compute_current_urgency(task, now)

    @staticmethod
    def normalize_priority(priority_score: float) -> float:
        """Map raw priority score (0–100) to landscape y-axis (0–10)."""
        return min(10.0, priority_score / 10.0)

    @staticmethod
    def get_priority_level(priority_score: float) -> PriorityLevel:
        for upper, label in _PRIORITY_THRESHOLDS:
            if priority_score < upper:
                return label
        return "critical"

    @staticmethod
    def get_dynamic_coordinates(
        task: Task, now: Optional[datetime] = None
    ) -> tuple[float, float, float, float]:
        """Return (effort, normalized_priority, priority_score, current_urgency)."""
        now = now or datetime.now(timezone.utc)
        urgency = TaskService.compute_current_urgency(task, now)
        effort = TaskService.compute_current_effort(task, now)
        score = task.importance_score * urgency
        priority_y = TaskService.normalize_priority(score)
        return effort, priority_y, score, urgency
