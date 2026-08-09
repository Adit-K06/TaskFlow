# Subtasks router — update and delete individual subtasks
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Subtask
from app.schemas.subtasks import SubtaskUpdate, SubtaskResponse

router = APIRouter(prefix="/subtasks", tags=["Subtasks"])


@router.patch("/{subtask_id}", response_model=SubtaskResponse)
def update_subtask(
    subtask_id: uuid.UUID, body: SubtaskUpdate, db: Session = Depends(get_db)
) -> Subtask:
    """Update a subtask's name or completion status."""
    subtask = db.get(Subtask, subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(subtask, field, value)
    db.commit()
    db.refresh(subtask)
    return subtask


@router.delete("/{subtask_id}", status_code=204)
def delete_subtask(subtask_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    subtask = db.get(Subtask, subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    db.delete(subtask)
    db.commit()
