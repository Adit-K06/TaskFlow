"""add_notes_table

Revision ID: a1b2c3d4e5f6
Revises: 9a9d07be252c
Create Date: 2026-08-16 15:32:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9a9d07be252c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create notes table and seed the singleton row."""
    op.create_table(
        'notes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False, server_default=''),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    # Seed the single row so the app never has to INSERT on first GET
    op.execute("INSERT INTO notes (id, content) VALUES (1, '') ON CONFLICT DO NOTHING")


def downgrade() -> None:
    """Drop notes table."""
    op.drop_table('notes')
