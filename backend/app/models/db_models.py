import datetime as dt
import uuid

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    start_date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    end_date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    budget_total: Mapped[float | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD", server_default="USD")
    num_travelers: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    interests: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, server_default="{}")
    travel_style: Mapped[str] = mapped_column(String(20), default="mid", server_default="mid")
    pace: Mapped[str] = mapped_column(String(20), default="moderate", server_default="moderate")
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    days: Mapped[list["ItineraryDay"]] = relationship(
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="ItineraryDay.day_index",
    )


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), index=True, nullable=False
    )
    day_index: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[dt.date | None] = mapped_column(Date)
    summary: Mapped[str | None] = mapped_column(Text)
    est_budget: Mapped[float | None] = mapped_column(Numeric(12, 2))
    is_user_edited: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    trip: Mapped["Trip"] = relationship(back_populates="days")
    items: Mapped[list["ItineraryItem"]] = relationship(
        back_populates="day",
        cascade="all, delete-orphan",
        order_by="ItineraryItem.sort_order",
    )


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    day_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("itinerary_days.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    start_time: Mapped[dt.time | None] = mapped_column(Time)
    end_time: Mapped[dt.time | None] = mapped_column(Time)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(20), default="activity", server_default="activity")
    description: Mapped[str | None] = mapped_column(Text)
    est_cost: Mapped[float | None] = mapped_column(Numeric(12, 2))
    booking_url: Mapped[str | None] = mapped_column(Text)
    place_name: Mapped[str | None] = mapped_column(String(200))
    address: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    google_place_id: Mapped[str | None] = mapped_column(String(200))
    is_user_edited: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    day: Mapped["ItineraryDay"] = relationship(back_populates="items")
