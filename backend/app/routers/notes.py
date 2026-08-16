# Notes router — GET and PATCH for the global single-row scratchpad
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Note
from app.schemas.notes import NoteResponse, NoteUpdate

router = APIRouter(prefix="/notes", tags=["Notes"])

NOTE_ID = 1  # There is always exactly one row


def _get_or_create(db: Session) -> Note:
    """Return the singleton Note row, creating it on first call."""
    note = db.get(Note, NOTE_ID)
    if note is None:
        note = Note(id=NOTE_ID, content="")
        db.add(note)
        db.commit()
        db.refresh(note)
    return note


@router.get("", response_model=NoteResponse)
def get_note(db: Session = Depends(get_db)) -> Note:
    """Return the global notes content."""
    return _get_or_create(db)


@router.patch("", response_model=NoteResponse)
def update_note(body: NoteUpdate, db: Session = Depends(get_db)) -> Note:
    """Replace the global notes content."""
    note = _get_or_create(db)
    note.content = body.content
    db.commit()
    db.refresh(note)
    return note
