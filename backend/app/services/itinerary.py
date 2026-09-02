"""Orchestrates generation: LLM -> optional Places enrichment -> persistence."""

import asyncio
from datetime import datetime, time, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import ItineraryDay, ItineraryItem, Trip
from app.services.fx import fetch_fx_rate, local_currency_for
from app.services.gemini import generate_days
from app.services.photos import fetch_photo
from app.services.places import enrich_item


def _parse_time(value: str | None) -> time | None:
    if not value:
        return None
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    return None


async def generate_itinerary(trip: Trip, db: AsyncSession) -> None:
    """(Re)generate the itinerary for a trip.

    Days the user has edited (or that contain an edited item) are preserved; every
    other day is replaced with freshly generated content. New days are linked into
    ``trip.days`` so the caller's in-memory object stays consistent after commit.
    """
    generated = await generate_days(trip)

    kept_day_indexes: set[int] = set()
    for day in list(trip.days):
        if day.is_user_edited or any(item.is_user_edited for item in day.items):
            kept_day_indexes.add(day.day_index)
        else:
            trip.days.remove(day)  # delete-orphan cascade removes the row on flush
    await db.flush()

    fresh_items: list[ItineraryItem] = []
    for gday in generated.days:
        if gday.day_index in kept_day_indexes:
            continue
        day = ItineraryDay(
            day_index=gday.day_index,
            date=trip.start_date + timedelta(days=gday.day_index - 1),
            summary=gday.summary,
            est_budget=gday.est_budget,
        )
        for order, gitem in enumerate(gday.items):
            item = ItineraryItem(
                sort_order=order,
                title=gitem.title,
                category=gitem.category,
                description=gitem.description,
                start_time=_parse_time(gitem.start_time),
                end_time=_parse_time(gitem.end_time),
                est_cost=gitem.est_cost,
                place_name=gitem.place_name,
            )
            await enrich_item(item, trip.destination)
            day.items.append(item)
            fresh_items.append(item)
        trip.days.append(day)

    await _attach_photos(fresh_items, trip.destination)
    await _snapshot_local_currency(trip)


async def _attach_photos(items: list[ItineraryItem], destination: str) -> None:
    """Fill photo_url / photo_attribution for freshly generated items, in parallel."""
    sem = asyncio.Semaphore(8)

    async def one(item: ItineraryItem) -> None:
        async with sem:
            hit = await fetch_photo(item.place_name, destination, item.category)
        if hit:
            item.photo_url, item.photo_attribution = hit

    await asyncio.gather(*(one(item) for item in items))


async def _snapshot_local_currency(trip: Trip) -> None:
    """Record the destination's local currency + a live rate for dual display."""
    trip_ccy = (trip.currency or "USD").upper()
    local_ccy = local_currency_for(trip.destination)
    if not local_ccy or local_ccy == trip_ccy:
        trip.local_currency = None
        trip.fx_rate = None
        return
    rate = await fetch_fx_rate(trip_ccy, local_ccy)
    if rate:
        trip.local_currency = local_ccy
        trip.fx_rate = rate
