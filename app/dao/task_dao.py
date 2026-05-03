"""Data-access layer for the Task entity."""

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task_model import Task


class TaskDAO:
    @staticmethod
    def create_task(
        db: Session,
        *,
        user_id: int,
        name: str,
        importance_score: float,
        initial_urgency_score: float,
        urgency_growth_rate: float,
    ) -> Task:
        task = Task(
            user_id=user_id,
            name=name,
            importance_score=importance_score,
            initial_urgency_score=initial_urgency_score,
            urgency_growth_rate=urgency_growth_rate,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
        return db.get(Task, task_id)

    @staticmethod
    def get_tasks_by_user(db: Session, user_id: int) -> list[Task]:
        stmt = select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc())
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def update_task(db: Session, task: Task, fields: dict[str, Any]) -> Task:
        # Only update keys that are actually provided (PATCH semantics).
        for key, value in fields.items():
            setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(db: Session, task: Task) -> None:
        db.delete(task)
        db.commit()
