"""add itinerary_items.photos (jsonb gallery)

Revision ID: 0005_item_photos_list
Revises: 0004_item_photos
Create Date: 2026-09-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005_item_photos_list"
down_revision: Union[str, None] = "0004_item_photos"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "itinerary_items", sa.Column("photos", postgresql.JSONB(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("itinerary_items", "photos")
