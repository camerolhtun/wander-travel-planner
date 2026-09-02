"""add trips.notes — free-text trip brief

Revision ID: 0002_trip_notes
Revises: 0001_init
Create Date: 2026-09-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_trip_notes"
down_revision: Union[str, None] = "0001_init"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trips", sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("trips", "notes")
