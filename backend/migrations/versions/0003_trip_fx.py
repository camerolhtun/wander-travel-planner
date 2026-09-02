"""add trips.local_currency + trips.fx_rate — dual-currency snapshot

Revision ID: 0003_trip_fx
Revises: 0002_trip_notes
Create Date: 2026-09-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_trip_fx"
down_revision: Union[str, None] = "0002_trip_notes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("trips", sa.Column("local_currency", sa.String(length=3), nullable=True))
    op.add_column(
        "trips", sa.Column("fx_rate", sa.Numeric(precision=18, scale=6), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("trips", "fx_rate")
    op.drop_column("trips", "local_currency")
