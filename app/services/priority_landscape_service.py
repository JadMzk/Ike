"""Dynamic task landscape: quadrants, recommendations, motivation hints."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.profile_model import Profile
from app.models.task_model import Task
from app.schemas.task_schema import PriorityLandscapePlan, Quadrant, TaskCoordinates
from app.services.task_service import TaskService


_AXIS_THRESHOLD = 5.0
DEFAULT_RECOMMENDATION_LIMIT = 5

_ALL_QUADRANTS: tuple[Quadrant, ...] = (
    "BigRock",
    "QuickWins",
    "NiceToDo",
    "PostponeDelegate",
)


class PriorityLandscapeService:
    @staticmethod
    def get_task_coordinates(
        db: Session, task: Task, now: Optional[datetime] = None
    ) -> TaskCoordinates:
        now = now or datetime.now(timezone.utc)
        effort, priority_y, score, urgency = TaskService.get_dynamic_coordinates(
            db, task, now
        )
        return TaskCoordinates(
            task_id=task.id,
            name=task.name,
            category=task.category,
            effort=effort,
            priority=priority_y,
            current_urgency=urgency,
            priority_score=score,
            quadrant=PriorityLandscapeService.classify_quadrant(effort, priority_y),
        )

    @staticmethod
    def classify_quadrant(effort: float, priority: float) -> Quadrant:
        """Pure 2×2 matrix at threshold 5 (effort × priority)."""
        high_pri = priority >= _AXIS_THRESHOLD
        high_eff = effort >= _AXIS_THRESHOLD
        if high_pri and high_eff:
            return "BigRock"
        if high_pri and not high_eff:
            return "QuickWins"
        if not high_pri and not high_eff:
            return "NiceToDo"
        return "PostponeDelegate"

    @staticmethod
    def get_recommended_tasks(
        coords: list[TaskCoordinates],
        limit: int = DEFAULT_RECOMMENDATION_LIMIT,
    ) -> list[TaskCoordinates]:
        ranked = sorted(coords, key=lambda c: c.priority_score, reverse=True)
        return ranked[:limit]

    @staticmethod
    def adapt_recommendations_to_motivation(
        coords: list[TaskCoordinates],
        motivation_score: Optional[int],
        limit: int = DEFAULT_RECOMMENDATION_LIMIT,
    ) -> list[TaskCoordinates]:
        if motivation_score is None:
            return PriorityLandscapeService.get_recommended_tasks(coords, limit)

        emphasize: Quadrant
        if motivation_score <= 4:
            emphasize = "QuickWins"
        elif motivation_score >= 8:
            emphasize = "BigRock"
        else:
            return PriorityLandscapeService.get_recommended_tasks(coords, limit)

        preferred = [c for c in coords if c.quadrant == emphasize]
        others = [c for c in coords if c.quadrant != emphasize]
        preferred.sort(key=lambda c: c.priority_score, reverse=True)
        others.sort(key=lambda c: c.priority_score, reverse=True)
        return (preferred + others)[:limit]

    @staticmethod
    def motivation_message(motivation_score: Optional[int]) -> Optional[str]:
        if motivation_score is None:
            return None
        if motivation_score <= 4:
            return "Today is a good day for quick wins"
        if motivation_score >= 8:
            return "You seem motivated today — tackle a big rock"
        return "Balance quick wins with one meaningful task"

    @staticmethod
    def get_profile_plan(
        db: Session,
        profile: Profile,
        *,
        motivation_score: Optional[int] = None,
    ) -> PriorityLandscapePlan:
        now = datetime.now(timezone.utc)
        tasks = TaskService.get_profile_tasks(db, profile)

        quadrants: dict[Quadrant, list[TaskCoordinates]] = {q: [] for q in _ALL_QUADRANTS}
        all_coords: list[TaskCoordinates] = []
        for task in tasks:
            coord = PriorityLandscapeService.get_task_coordinates(db, task, now)
            quadrants[coord.quadrant].append(coord)
            all_coords.append(coord)

        for bucket in quadrants.values():
            bucket.sort(key=lambda c: c.priority_score, reverse=True)

        recommendations = PriorityLandscapeService.adapt_recommendations_to_motivation(
            all_coords, motivation_score
        )

        return PriorityLandscapePlan(
            profile_id=profile.id,
            quadrants=quadrants,
            recommendations=recommendations,
            motivation_message=PriorityLandscapeService.motivation_message(motivation_score),
        )

    @staticmethod
    def get_user_plan(
        db: Session,
        user_id: int,
        *,
        motivation_score: Optional[int] = None,
    ) -> PriorityLandscapePlan:
        """Legacy integer user_id."""
        now = datetime.now(timezone.utc)
        tasks = TaskService.get_user_tasks(db, user_id)

        quadrants: dict[Quadrant, list[TaskCoordinates]] = {q: [] for q in _ALL_QUADRANTS}
        all_coords: list[TaskCoordinates] = []
        for task in tasks:
            coord = PriorityLandscapeService.get_task_coordinates(db, task, now)
            quadrants[coord.quadrant].append(coord)
            all_coords.append(coord)

        for bucket in quadrants.values():
            bucket.sort(key=lambda c: c.priority_score, reverse=True)

        recommendations = PriorityLandscapeService.adapt_recommendations_to_motivation(
            all_coords, motivation_score
        )

        return PriorityLandscapePlan(
            user_id=user_id,
            quadrants=quadrants,
            recommendations=recommendations,
            motivation_message=PriorityLandscapeService.motivation_message(motivation_score),
        )
