"""init: trips, itinerary_days, itinerary_items

Revision ID: 0001_init
Revises:
Create Date: 2026-09-01

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "trips",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("destination", sa.String(length=200), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("budget_total", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("currency", sa.String(length=3), server_default="USD", nullable=False),
        sa.Column("num_travelers", sa.Integer(), server_default="1", nullable=False),
        sa.Column(
            "interests",
            postgresql.ARRAY(sa.String()),
            server_default=sa.text("'{}'::varchar[]"),
            nullable=False,
        ),
        sa.Column("travel_style", sa.String(length=20), server_default="mid", nullable=False),
        sa.Column("pace", sa.String(length=20), server_default="moderate", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="draft", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_trips_user_id", "trips", ["user_id"])

    op.create_table(
        "itinerary_days",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("day_index", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("est_budget", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column(
            "is_user_edited", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_itinerary_days_trip_id", "itinerary_days", ["trip_id"])

    op.create_table(
        "itinerary_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("day_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=20), server_default="activity", nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("est_cost", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("booking_url", sa.Text(), nullable=True),
        sa.Column("place_name", sa.String(length=200), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("google_place_id", sa.String(length=200), nullable=True),
        sa.Column(
            "is_user_edited", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["day_id"], ["itinerary_days.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_itinerary_items_day_id", "itinerary_items", ["day_id"])


def downgrade() -> None:
    op.drop_table("itinerary_items")
    op.drop_table("itinerary_days")
    op.drop_index("ix_trips_user_id", table_name="trips")
    op.drop_table("trips")
