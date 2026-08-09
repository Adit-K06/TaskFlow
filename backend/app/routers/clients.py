# Clients router — full CRUD for Client entities
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.models import Client, Task
from app.schemas.clients import ClientCreate, ClientUpdate, ClientResponse
from app.schemas.tasks import TaskCreate, TaskResponse
from app.routers.tasks import _enrich

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=list[ClientResponse])
def list_clients(db: Session = Depends(get_db)) -> list[Client]:
    """Return all clients ordered by creation time."""
    return list(db.scalars(select(Client).order_by(Client.created_at)))


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(body: ClientCreate, db: Session = Depends(get_db)) -> Client:
    """Create a new client."""
    client = Client(**body.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: uuid.UUID, db: Session = Depends(get_db)) -> Client:
    """Fetch a single client by ID."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: uuid.UUID, body: ClientUpdate, db: Session = Depends(get_db)
) -> Client:
    """Partially update a client's name, category, or color."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    """Delete a client and cascade-delete all its tasks and subtasks."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()


@router.get("/{client_id}/tasks", response_model=list[TaskResponse])
def list_client_tasks(client_id: uuid.UUID, db: Session = Depends(get_db)) -> list[dict]:
    """Return all tasks for a specific client, ordered by sr_no."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    tasks = list(db.scalars(select(Task).where(Task.client_id == client_id).order_by(Task.sr_no)))
    return [_enrich(t, db) for t in tasks]


@router.post("/{client_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    client_id: uuid.UUID, body: TaskCreate, db: Session = Depends(get_db)
) -> dict:
    """Create a new task under a client. sr_no is auto-assigned as max + 1."""
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    existing = list(db.scalars(select(Task).where(Task.client_id == client_id)))
    next_sr = max((t.sr_no for t in existing), default=0) + 1

    task = Task(client_id=client_id, sr_no=next_sr, **body.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return _enrich(task, db)
