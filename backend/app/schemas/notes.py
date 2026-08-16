# Pydantic v2 schemas for the global Notes scratchpad
from datetime import datetime
from pydantic import BaseModel


class NoteResponse(BaseModel):
    id: int
    content: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteUpdate(BaseModel):
    content: str
