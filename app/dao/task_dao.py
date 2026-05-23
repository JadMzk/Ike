"""Data-access layer for the Task entity."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task_model import Task


class TaskDAO:
    @staticmethod
    def create_task(
        db: Session,
        *,
        profile_id: uuid.UUID,
        name: str,
        category: str,
        importance_score: float,
        initial_urgency_score: float,
        urgency_growth_rate: float,
        initial_effort: float,
        resistance_factor: float,
    ) -> Task:
        task = Task(
            profile_id=profile_id,
            name=name,
            category=category,
            importance_score=importance_score,
            initial_urgency_score=initial_urgency_score,
            urgency_growth_rate=urgency_growth_rate,
            initial_effort=initial_effort,
            resistance_factor=resistance_factor,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
        return db.get(Task, task_id)

    @staticmethod
    def get_tasks_by_profile(
        db: Session,
        profile_id: uuid.UUID,
        *,
        include_completed: bool = False,
    ) -> list[Task]:
        stmt = select(Task).where(Task.profile_id == profile_id)
        if not include_completed:
            stmt = stmt.where(Task.completed.is_(False))
        stmt = stmt.order_by(Task.created_at.desc())
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def create_task_legacy(
        db: Session,
        *,
        user_id: int,
        name: str,
        category: str,
        importance_score: float,
        initial_urgency_score: float,
        urgency_growth_rate: float,
        initial_effort: float,
        resistance_factor: float,
    ) -> Task:
        """Pre-auth MVP: tasks owned by integer users.id."""
        task = Task(
            user_id=user_id,
            name=name,
            category=category,
            importance_score=importance_score,
            initial_urgency_score=initial_urgency_score,
            urgency_growth_rate=urgency_growth_rate,
            initial_effort=initial_effort,
            resistance_factor=resistance_factor,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_tasks_by_user(
        db: Session,
        user_id: int,
        *,
        include_completed: bool = False,
    ) -> list[Task]:
        """Legacy integer user_id (pre-auth MVP test data)."""
        stmt = select(Task).where(Task.user_id == user_id)
        if not include_completed:
            stmt = stmt.where(Task.completed.is_(False))
        stmt = stmt.order_by(Task.created_at.desc())
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def update_task(db: Session, task: Task, fields: dict[str, Any]) -> Task:
        for key, value in fields.items():
            setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def mark_completed(db: Session, task: Task) -> Task:
        task.completed = True
        task.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(db: Session, task: Task) -> None:
        db.delete(task)
        db.commit()
