"""Optional enrichment of itinerary items with Google Places (New) data."""

import httpx

from app.config import get_settings
from app.models.db_models import ItineraryItem

_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location"


async def enrich_item(item: ItineraryItem, destination: str) -> None:
    """Fill place_id / address / lat / lng in place. No-op without an API key."""
    settings = get_settings()
    if not settings.google_places_api_key:
        return

    query = f"{item.place_name or item.title}, {destination}"
    headers = {
        "X-Goog-Api-Key": settings.google_places_api_key,
        "X-Goog-FieldMask": _FIELD_MASK,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(_SEARCH_URL, json={"textQuery": query}, headers=headers)
    except httpx.HTTPError:
        return
    if resp.status_code != 200:
        return

    places = resp.json().get("places") or []
    if not places:
        return
    top = places[0]
    item.google_place_id = top.get("id")
    item.place_name = (top.get("displayName") or {}).get("text") or item.place_name
    item.address = top.get("formattedAddress")
    location = top.get("location") or {}
    item.lat = location.get("latitude")
    item.lng = location.get("longitude")
