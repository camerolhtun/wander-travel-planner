"""Itinerary generation via the Gemini API, with a no-key mock fallback."""

import json

from app.config import get_settings
from app.models.db_models import Trip
from app.models.schemas import GeneratedDay, GeneratedItem, GeneratedItinerary


def _num_days(trip: Trip) -> int:
    return max((trip.end_date - trip.start_date).days + 1, 1)


def _build_prompt(trip: Trip) -> str:
    interests = ", ".join(trip.interests) or "general sightseeing"
    budget = f"{trip.budget_total} {trip.currency}" if trip.budget_total else "flexible"
    return (
        f"Plan a {_num_days(trip)}-day trip to {trip.destination}.\n"
        f"Dates: {trip.start_date} to {trip.end_date}. Travelers: {trip.num_travelers}.\n"
        f"Total budget: {budget}. Interests: {interests}.\n"
        f"Travel style: {trip.travel_style}. Preferred pace: {trip.pace}.\n\n"
        "For each day give a one-sentence summary, an estimated daily budget for the whole "
        f"party in {trip.currency}, and 3-6 time-ordered items. Each item has a title, a "
        "category (attraction | food | activity | transit | rest), a short description, "
        "start/end time in 24h HH:MM, an estimated cost for the party, and a real local "
        f"place_name where relevant. Keep the day's load consistent with a {trip.pace} pace "
        f"and {trip.travel_style} budget. Respond with JSON matching the schema."
    )


def _mock_itinerary(trip: Trip) -> GeneratedItinerary:
    n = _num_days(trip)
    per_day = round(float(trip.budget_total) / n, 2) if trip.budget_total else 120.0
    days: list[GeneratedDay] = []
    for i in range(1, n + 1):
        days.append(
            GeneratedDay(
                day_index=i,
                summary=(
                    f"Day {i}: sample plan for {trip.destination}. "
                    "Set GEMINI_API_KEY for a real itinerary."
                ),
                est_budget=per_day,
                items=[
                    GeneratedItem(
                        title=f"Morning exploration of {trip.destination}",
                        category="activity",
                        description="Placeholder morning activity.",
                        start_time="09:00",
                        end_time="11:30",
                        est_cost=0.0,
                        place_name=None,
                    ),
                    GeneratedItem(
                        title="Lunch at a local favourite",
                        category="food",
                        description="Placeholder food suggestion.",
                        start_time="12:30",
                        end_time="13:30",
                        est_cost=round(per_day * 0.2, 2),
                        place_name=None,
                    ),
                    GeneratedItem(
                        title="Afternoon landmark visit",
                        category="attraction",
                        description="Placeholder attraction.",
                        start_time="14:30",
                        end_time="17:00",
                        est_cost=round(per_day * 0.15, 2),
                        place_name=None,
                    ),
                ],
            )
        )
    return GeneratedItinerary(days=days)


async def generate_days(trip: Trip) -> GeneratedItinerary:
    settings = get_settings()
    if not settings.gemini_api_key:
        return _mock_itinerary(trip)

    from google import genai

    client = genai.Client(api_key=settings.gemini_api_key)
    response = await client.aio.models.generate_content(
        model=settings.gemini_model,
        contents=_build_prompt(trip),
        config={
            "response_mime_type": "application/json",
            "response_schema": GeneratedItinerary,
        },
    )
    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, GeneratedItinerary):
        return parsed
    return GeneratedItinerary.model_validate(json.loads(response.text))
