# SQLAlchemy ORM models — Client, Task, Subtask matching design.md Section 2 exactly
import enum
import uuid
from sqlalchemy import (
    String, Text, Integer, Boolean, Date, DateTime,
    ForeignKey, Enum as SAEnum, JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class TaskStatus(str, enum.Enum):
    """Allowed values for Task.status — stored as string in Postgres."""
    not_started = "not_started"
    ongoing = "ongoing"
    completed = "completed"


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#B5502F")
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Cascade: deleting a client deletes all its tasks (and their subtasks via Task cascade)
    tasks: Mapped[list["Task"]] = relationship(
        "Task", back_populates="client", cascade="all, delete-orphan"
    )


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False
    )
    sr_no: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    assignees: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus, name="taskstatus", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TaskStatus.not_started,
    )
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    client: Mapped["Client"] = relationship("Client", back_populates="tasks")
    # Cascade: deleting a task deletes all its subtasks
    subtasks: Mapped[list["Subtask"]] = relationship(
        "Subtask", back_populates="task", cascade="all, delete-orphan"
    )


class Subtask(Base):
    __tablename__ = "subtasks"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # No updated_at on Subtask per design.md Section 2.3
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    task: Mapped["Task"] = relationship("Task", back_populates="subtasks")
