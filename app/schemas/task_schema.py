"""Pydantic schemas for the Task resource and the Eisenhower plan."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


PriorityLevel = Literal["low", "medium", "high", "critical"]
Quadrant = Literal["Do", "Schedule", "Delegate", "Eliminate"]


class TaskCreate(BaseModel):
    """Payload for creating a new task."""

    name: str = Field(..., min_length=1, max_length=255)
    importance_score: float = Field(..., ge=0, le=10)
    initial_urgency_score: float = Field(..., ge=0, le=10)
    urgency_growth_rate: float = Field(0.5, ge=0)


class TaskUpdate(BaseModel):
    """PATCH payload — every field is optional."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    importance_score: Optional[float] = Field(None, ge=0, le=10)
    initial_urgency_score: Optional[float] = Field(None, ge=0, le=10)
    urgency_growth_rate: Optional[float] = Field(None, ge=0)


class TaskRead(BaseModel):
    """Stored fields returned to the client."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    importance_score: float
    initial_urgency_score: float
    urgency_growth_rate: float
    created_at: datetime


class TaskWithDynamics(TaskRead):
    """Task enriched with computed (non-stored) fields."""

    current_urgency: float
    priority_score: float
    priority_level: PriorityLevel


class TaskCoordinates(BaseModel):
    """Eisenhower-matrix coordinates for a task."""

    task_id: int
    name: str
    importance: float  # y-axis
    urgency: float     # x-axis (current_urgency)
    priority_score: float
    quadrant: Quadrant


class EisenhowerPlan(BaseModel):
    """Full plan returned by /users/{id}/eisenhower-plan."""

    user_id: int
    quadrants: dict[Quadrant, list[TaskCoordinates]]
    recommendations: list[TaskCoordinates]
