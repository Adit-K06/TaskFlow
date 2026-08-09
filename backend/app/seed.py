# Seed script — populates the two example clients from design.md Section 10
# Run: python -m app.seed  (from the backend/ directory with venv active)
import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from app.database import SessionLocal
from app.models.models import Client, Task, Subtask, TaskStatus


def seed() -> None:
    db = SessionLocal()
    try:
        today = date.today()

        # ── Client 1: Skyline Residence ──────────────────────────────────────
        c1 = Client(name="Skyline Residence", category="3D Design", color="#B5502F")
        db.add(c1)
        db.flush()

        t1 = Task(
            client_id=c1.id,
            sr_no=1,
            name="Initial concept renders",
            status=TaskStatus.ongoing,
            due_date=today + timedelta(days=7),
            assignees=["Adit"],
            is_completed=False,
        )
        db.add(t1)
        db.flush()

        db.add(Subtask(task_id=t1.id, name="Exterior massing model", is_completed=True))
        db.add(Subtask(task_id=t1.id, name="Interior lighting pass", is_completed=False))

        db.add(Task(
            client_id=c1.id,
            sr_no=2,
            name="Client revision round 1",
            status=TaskStatus.not_started,
            due_date=today + timedelta(days=10),
            assignees=[],
            is_completed=False,
        ))

        db.add(Task(
            client_id=c1.id,
            sr_no=3,
            name="Final deliverable export",
            status=TaskStatus.not_started,
            due_date=None,
            assignees=[],
            is_completed=False,
        ))

        # ── Client 2: Oak & Marble Studio ───────────────────────────────────
        c2 = Client(name="Oak & Marble Studio", category="2D Drawings", color="#5B6FA8")
        db.add(c2)
        db.flush()

        db.add(Task(
            client_id=c2.id,
            sr_no=1,
            name="Floor plan draft",
            status=TaskStatus.completed,
            due_date=today - timedelta(days=5),
            assignees=["Adit", "Riya"],
            is_completed=True,
        ))

        db.add(Task(
            client_id=c2.id,
            sr_no=2,
            name="Elevation drawings",
            status=TaskStatus.ongoing,
            due_date=today + timedelta(days=3),
            assignees=["Riya"],
            is_completed=False,
        ))

        db.add(Task(
            client_id=c2.id,
            sr_no=3,
            name="Material schedule",
            status=TaskStatus.not_started,
            due_date=today + timedelta(days=14),
            assignees=[],
            is_completed=False,
        ))

        db.add(Task(
            client_id=c2.id,
            sr_no=4,
            name="As-built documentation",
            status=TaskStatus.not_started,
            due_date=None,
            assignees=[],
            is_completed=False,
        ))

        db.commit()
        print("✅ Seed complete — 2 clients, 7 tasks, 2 subtasks created.")
    except Exception as exc:
        db.rollback()
        print(f"❌ Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
