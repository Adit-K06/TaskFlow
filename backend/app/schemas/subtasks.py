# Pydantic v2 schemas for Subtask — request and response shapes
import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class SubtaskCreate(BaseModel):
    name: str = Field(..., max_length=500)
    is_completed: bool = False


class SubtaskUpdate(BaseModel):
    name: str | None = Field(None, max_length=500)
    is_completed: bool | None = None


class SubtaskResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    name: str
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}
