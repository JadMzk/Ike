"""Eisenhower-matrix logic built on top of TaskService."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.task_model import Task
from app.schemas.task_schema import EisenhowerPlan, Quadrant, TaskCoordinates
from app.services.task_service import TaskService


# Threshold above which a dimension is considered "high".
_AXIS_THRESHOLD: float = 5.0
DEFAULT_RECOMMENDATION_LIMIT: int = 5


class EisenhowerService:
    @staticmethod
    def get_task_coordinates(task: Task, now: Optional[datetime] = None) -> TaskCoordinates:
        now = now or datetime.now(timezone.utc)
        urgency = TaskService.compute_current_urgency(task, now)
        priority = task.importance_score * urgency
        return TaskCoordinates(
            task_id=task.id,
            name=task.name,
            importance=task.importance_score,
            urgency=urgency,
            priority_score=priority,
            quadrant=EisenhowerService._classify(task.importance_score, urgency),
        )

    @staticmethod
    def classify_task_quadrant(task: Task, now: Optional[datetime] = None) -> Quadrant:
        urgency = TaskService.compute_current_urgency(task, now)
        return EisenhowerService._classify(task.importance_score, urgency)

    @staticmethod
    def get_top_recommendations(
        db: Session,
        user_id: int,
        limit: int = DEFAULT_RECOMMENDATION_LIMIT,
    ) -> list[TaskCoordinates]:
        now = datetime.now(timezone.utc)
        coords = [
            EisenhowerService.get_task_coordinates(t, now)
            for t in TaskService.get_user_tasks(db, user_id)
        ]
        coords.sort(key=lambda c: c.priority_score, reverse=True)
        return coords[:limit]

    @staticmethod
    def get_user_plan(db: Session, user_id: int) -> EisenhowerPlan:
        now = datetime.now(timezone.utc)
        tasks = TaskService.get_user_tasks(db, user_id)

        quadrants: dict[Quadrant, list[TaskCoordinates]] = {
            "Do": [],
            "Schedule": [],
            "Delegate": [],
            "Eliminate": [],
        }
        all_coords: list[TaskCoordinates] = []
        for task in tasks:
            coord = EisenhowerService.get_task_coordinates(task, now)
            quadrants[coord.quadrant].append(coord)
            all_coords.append(coord)

        # Sort each quadrant by priority desc for nicer UX.
        for bucket in quadrants.values():
            bucket.sort(key=lambda c: c.priority_score, reverse=True)

        all_coords.sort(key=lambda c: c.priority_score, reverse=True)

        return EisenhowerPlan(
            user_id=user_id,
            quadrants=quadrants,
            recommendations=all_coords[:DEFAULT_RECOMMENDATION_LIMIT],
        )

    # ------------------------------------------------------------- internal

    @staticmethod
    def _classify(importance: float, urgency: float) -> Quadrant:
        important = importance >= _AXIS_THRESHOLD
        urgent = urgency >= _AXIS_THRESHOLD
        if urgent and important:
            return "Do"
        if not urgent and important:
            return "Schedule"
        if urgent and not important:
            return "Delegate"
        return "Eliminate"
