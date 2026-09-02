"""add itinerary_items.photo_url + photo_attribution

Revision ID: 0004_item_photos
Revises: 0003_trip_fx
Create Date: 2026-09-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_item_photos"
down_revision: Union[str, None] = "0003_trip_fx"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("itinerary_items", sa.Column("photo_url", sa.Text(), nullable=True))
    op.add_column(
        "itinerary_items", sa.Column("photo_attribution", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("itinerary_items", "photo_attribution")
    op.drop_column("itinerary_items", "photo_url")
