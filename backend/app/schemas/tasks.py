# Pydantic v2 schemas for Task — request and response shapes
import uuid
from datetime import datetime, date
from pydantic import BaseModel, Field, computed_field
from sqlalchemy.orm import object_session
from app.models.models import TaskStatus


class TaskCreate(BaseModel):
    name: str = Field(..., max_length=500)
    remarks: str | None = None
    start_date: date | None = None
    due_date: date | None = None
    assignees: list[str] = Field(default_factory=list)
    status: TaskStatus = TaskStatus.not_started
    is_completed: bool = False


class TaskUpdate(BaseModel):
    name: str | None = Field(None, max_length=500)
    remarks: str | None = None
    start_date: date | None = None
    due_date: date | None = None
    assignees: list[str] | None = None
    status: TaskStatus | None = None
    is_completed: bool | None = None
    sr_no: int | None = None


class TaskReorder(BaseModel):
    """New ordered list of task IDs within a client — sr_no reassigned positionally."""
    task_ids: list[uuid.UUID]


class TaskResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    sr_no: int
    name: str
    remarks: str | None
    start_date: date | None
    due_date: date | None
    assignees: list[str]
    status: TaskStatus
    is_completed: bool
    subtask_count: int = 0
    completed_subtask_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

