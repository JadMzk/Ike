"""Pydantic schemas for the Task resource and the priority landscape."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


PriorityLevel = Literal["low", "medium", "high", "critical"]
Quadrant = Literal["BigRock", "QuickWins", "NiceToDo", "PostponeDelegate"]

TASK_CATEGORIES = ("admin", "work", "study", "sport", "personal", "health")


class TaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field("personal", min_length=1, max_length=64)
    importance_score: float = Field(..., ge=0, le=10)
    initial_urgency_score: float = Field(..., ge=0, le=10)
    urgency_growth_rate: float = Field(0.5, ge=0)
    initial_effort: float = Field(5.0, ge=0, le=10)


class TaskUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=64)
    importance_score: Optional[float] = Field(None, ge=0, le=10)
    initial_urgency_score: Optional[float] = Field(None, ge=0, le=10)
    urgency_growth_rate: Optional[float] = Field(None, ge=0)
    initial_effort: Optional[float] = Field(None, ge=0, le=10)


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    profile_id: Optional[UUID] = None
    user_id: Optional[int] = None  # legacy pre-auth rows only
    name: str
    category: str
    importance_score: float
    initial_urgency_score: float
    urgency_growth_rate: float
    initial_effort: float
    created_at: datetime
    completed: bool = False
    completed_at: Optional[datetime] = None


class TaskWithDynamics(TaskRead):
    """Task enriched with computed (non-stored) fields."""

    current_urgency: float
    current_effort: float
    priority_score: float
    priority_level: PriorityLevel


class TaskCoordinates(BaseModel):
    """Dynamic task landscape coordinates."""

    task_id: int
    name: str
    category: str
    effort: float  # x-axis (current_effort)
    priority: float  # y-axis (normalized 0–10)
    current_urgency: float
    priority_score: float
    quadrant: Quadrant


class PriorityLandscapePlan(BaseModel):
    """Full landscape for a user or profile."""

    profile_id: Optional[UUID] = None
    user_id: Optional[int] = None  # legacy only
    quadrants: dict[Quadrant, list[TaskCoordinates]]
    recommendations: list[TaskCoordinates]
    motivation_message: Optional[str] = None
