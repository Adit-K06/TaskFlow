# Pydantic v2 schemas for Client — request and response shapes
import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ClientCreate(BaseModel):
    name: str = Field(..., max_length=255)
    category: str | None = Field(None, max_length=100)
    color: str = Field("#B5502F", max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")


class ClientUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    category: str | None = Field(None, max_length=100)
    color: str | None = Field(None, max_length=7, pattern=r"^#[0-9A-Fa-f]{6}$")


class ClientResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: str | None
    color: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
