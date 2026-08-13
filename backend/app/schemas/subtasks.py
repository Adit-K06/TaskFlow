# Pydantic v2 schemas for Subtask — request and response shapes
import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field
from app.models.models import TaskStatus


class SubtaskCreate(BaseModel):
    name: str = Field(..., max_length=500)
    remarks: str | None = Field(None, max_length=300)
    start_date: date | None = None
    due_date: date | None = None
    assignees: list[str] = []
    status: TaskStatus = TaskStatus.not_started
    is_completed: bool = False


class SubtaskUpdate(BaseModel):
    name: str | None = Field(None, max_length=500)
    remarks: str | None = Field(None, max_length=300)
    start_date: date | None = None
    due_date: date | None = None
    assignees: list[str] | None = None
    status: TaskStatus | None = None
    is_completed: bool | None = None


class SubtaskResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    name: str
    remarks: str | None
    start_date: date | None
    due_date: date | None
    assignees: list[str]
    status: TaskStatus
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
