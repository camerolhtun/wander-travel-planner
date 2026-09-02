import datetime as dt
import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

TravelStyle = Literal["budget", "mid", "luxury"]
Pace = Literal["relaxed", "moderate", "packed"]
ItemCategory = Literal["attraction", "food", "activity", "transit", "rest"]

MAX_TRIP_DAYS = 21
MAX_TRAVELERS = 30


# --------------------------------------------------------------------------- trips
class TripCreate(BaseModel):
    destination: str = Field(min_length=1, max_length=200)
    start_date: dt.date
    end_date: dt.date
    budget_total: float | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=1, max_length=3)
    num_travelers: int = Field(default=1, ge=1, le=MAX_TRAVELERS)
    interests: list[str] = Field(default_factory=list)
    travel_style: TravelStyle = "mid"
    pace: Pace = "moderate"
    notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def _check_dates(self) -> "TripCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if (self.end_date - self.start_date).days + 1 > MAX_TRIP_DAYS:
            raise ValueError(f"trip length is capped at {MAX_TRIP_DAYS} days")
        return self


class TripUpdate(BaseModel):
    destination: str | None = Field(default=None, max_length=200)
    start_date: dt.date | None = None
    end_date: dt.date | None = None
    budget_total: float | None = None
    currency: str | None = None
    num_travelers: int | None = Field(default=None, ge=1)
    interests: list[str] | None = None
    travel_style: TravelStyle | None = None
    pace: Pace | None = None
    notes: str | None = Field(default=None, max_length=2000)
    status: str | None = None


# --------------------------------------------------------------------------- items
class ItemBase(BaseModel):
    sort_order: int = 0
    start_time: dt.time | None = None
    end_time: dt.time | None = None
    title: str
    category: ItemCategory = "activity"
    description: str | None = None
    est_cost: float | None = None
    booking_url: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    sort_order: int | None = None
    start_time: dt.time | None = None
    end_time: dt.time | None = None
    title: str | None = None
    category: ItemCategory | None = None
    description: str | None = None
    est_cost: float | None = None
    booking_url: str | None = None


class ItemOut(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    day_id: uuid.UUID
    place_name: str | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    google_place_id: str | None = None
    is_user_edited: bool = False


# ---------------------------------------------------------------------------- days
class DayUpdate(BaseModel):
    summary: str | None = None
    est_budget: float | None = None


class DayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    trip_id: uuid.UUID
    day_index: int
    date: dt.date | None = None
    summary: str | None = None
    est_budget: float | None = None
    is_user_edited: bool = False
    items: list[ItemOut] = []


# ------------------------------------------------------------------------ trip out
class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    destination: str
    start_date: dt.date
    end_date: dt.date
    budget_total: float | None = None
    currency: str
    num_travelers: int
    interests: list[str]
    travel_style: str
    pace: str
    notes: str | None = None
    status: str
    created_at: dt.datetime
    updated_at: dt.datetime


class TripDetailOut(TripOut):
    days: list[DayOut] = []


# ------------------------------------------------------------------------- reorder
class ReorderEntry(BaseModel):
    id: uuid.UUID
    day_id: uuid.UUID
    sort_order: int


class ReorderRequest(BaseModel):
    items: list[ReorderEntry]


# ------------------------------------------------------- LLM generation schema
class GeneratedItem(BaseModel):
    title: str
    category: ItemCategory
    description: str
    start_time: str | None = Field(default=None, description="24h HH:MM")
    end_time: str | None = Field(default=None, description="24h HH:MM")
    est_cost: float | None = Field(default=None, description="party total, trip currency")
    place_name: str | None = None


class GeneratedDay(BaseModel):
    day_index: int
    summary: str
    est_budget: float | None = None
    items: list[GeneratedItem]


class GeneratedItinerary(BaseModel):
    days: list[GeneratedDay]
