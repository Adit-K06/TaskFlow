# Tasks router — read/update/delete individual tasks + reorder
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_db
from app.models.models import Task, Subtask
from app.schemas.tasks import TaskUpdate, TaskReorder, TaskResponse
from app.schemas.subtasks import SubtaskCreate, SubtaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _enrich(task: Task, db: Session) -> dict:
    """Attach subtask_count and completed_subtask_count to a Task ORM object dict."""
    total = db.scalar(
        select(func.count()).where(Subtask.task_id == task.id)
    ) or 0
    done = db.scalar(
        select(func.count()).where(Subtask.task_id == task.id, Subtask.is_completed.is_(True))
    ) or 0
    d = {c.key: getattr(task, c.key) for c in task.__table__.columns}
    d["subtask_count"] = total
    d["completed_subtask_count"] = done
    return d


@router.get("", response_model=list[TaskResponse])
def list_all_tasks(
    client_id: uuid.UUID | None = Query(None),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Return all tasks across all clients (home view). Optional ?client_id= filter."""
    stmt = select(Task).order_by(Task.due_date.asc().nullslast(), Task.sr_no)
    if client_id:
        stmt = stmt.where(Task.client_id == client_id)
    tasks = list(db.scalars(stmt))
    return [_enrich(t, db) for t in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: uuid.UUID, db: Session = Depends(get_db)) -> dict:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _enrich(task, db)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: uuid.UUID, body: TaskUpdate, db: Session = Depends(get_db)
) -> dict:
    """Partially update any task fields (inline edit, status change, checkbox)."""
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return _enrich(task, db)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


@router.patch("/{task_id}/reorder", response_model=list[TaskResponse])
def reorder_tasks(
    task_id: uuid.UUID, body: TaskReorder, db: Session = Depends(get_db)
) -> list[dict]:
    """Re-assign sr_no for the client's tasks based on the provided ordered list of IDs."""
    anchor = db.get(Task, task_id)
    if not anchor:
        raise HTTPException(status_code=404, detail="Task not found")

    tasks_by_id: dict[uuid.UUID, Task] = {
        t.id: t
        for t in db.scalars(select(Task).where(Task.client_id == anchor.client_id))
    }
    for idx, tid in enumerate(body.task_ids, start=1):
        if tid in tasks_by_id:
            tasks_by_id[tid].sr_no = idx
    db.commit()
    tasks = list(db.scalars(
        select(Task).where(Task.client_id == anchor.client_id).order_by(Task.sr_no)
    ))
    return [_enrich(t, db) for t in tasks]


# ── Subtasks (nested under tasks) ──────────────────────────────────────────────

@router.get("/{task_id}/subtasks", response_model=list[SubtaskResponse])
def list_subtasks(task_id: uuid.UUID, db: Session = Depends(get_db)) -> list[Subtask]:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return list(db.scalars(select(Subtask).where(Subtask.task_id == task_id).order_by(Subtask.created_at)))


@router.post("/{task_id}/subtasks", response_model=SubtaskResponse, status_code=201)
def create_subtask(
    task_id: uuid.UUID, body: SubtaskCreate, db: Session = Depends(get_db)
) -> Subtask:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    subtask = Subtask(task_id=task_id, **body.model_dump())
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask
