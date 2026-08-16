# Backup router — exports all data as a downloadable JSON file
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Client, Task, Subtask, Note

router = APIRouter(prefix="/backup", tags=["Backup"])


def _uuid_str(val) -> str:
    return str(val) if val is not None else None


def _date_str(val) -> str | None:
    return val.isoformat() if val is not None else None


def _dt_str(val) -> str | None:
    return val.isoformat() if val is not None else None


@router.get("/export")
def export_backup(db: Session = Depends(get_db)) -> Response:
    """Download a full JSON backup of all clients, tasks, subtasks, and notes."""
    clients_rows = db.scalars(select(Client)).all()
    tasks_rows = db.scalars(select(Task)).all()
    subtasks_rows = db.scalars(select(Subtask)).all()

    note_row = db.get(Note, 1)
    notes_content = note_row.content if note_row else ""

    payload = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "notes": notes_content,
        "clients": [
            {
                "id": _uuid_str(c.id),
                "name": c.name,
                "category": c.category,
                "color": c.color,
                "created_at": _dt_str(c.created_at),
                "updated_at": _dt_str(c.updated_at),
            }
            for c in clients_rows
        ],
        "tasks": [
            {
                "id": _uuid_str(t.id),
                "client_id": _uuid_str(t.client_id),
                "sr_no": t.sr_no,
                "name": t.name,
                "remarks": t.remarks,
                "start_date": _date_str(t.start_date),
                "due_date": _date_str(t.due_date),
                "assignees": t.assignees,
                "status": t.status.value if t.status else None,
                "is_completed": t.is_completed,
                "created_at": _dt_str(t.created_at),
                "updated_at": _dt_str(t.updated_at),
            }
            for t in tasks_rows
        ],
        "subtasks": [
            {
                "id": _uuid_str(s.id),
                "task_id": _uuid_str(s.task_id),
                "name": s.name,
                "remarks": s.remarks,
                "start_date": _date_str(s.start_date),
                "due_date": _date_str(s.due_date),
                "assignees": s.assignees,
                "status": s.status.value if s.status else None,
                "is_completed": s.is_completed,
                "created_at": _dt_str(s.created_at),
                "updated_at": _dt_str(s.updated_at),
            }
            for s in subtasks_rows
        ],
    }

    filename = f"taskflow_backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    return Response(
        content=json.dumps(payload, indent=2, ensure_ascii=False),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
