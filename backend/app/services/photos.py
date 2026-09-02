"""Best-effort place photos: a real Wikipedia image first, then an Unsplash
fallback (stock photo of the vibe) when an Unsplash key is configured.

Returns ``(image_url, attribution)`` or ``None``. Never raises.
"""

import httpx

from app.config import get_settings

_WIKI_API = "https://en.wikipedia.org/w/api.php"
_UNSPLASH_SEARCH = "https://api.unsplash.com/search/photos"
_UA = "WanderTravelPlanner/1.0 (https://github.com/camerolhtun/wander-travel-planner)"


async def _wikipedia_photo(client: httpx.AsyncClient, place_name: str) -> tuple[str, str] | None:
    """Lead image of the best-matching Wikipedia article, via the Action API."""
    try:
        resp = await client.get(
            _WIKI_API,
            params={
                "action": "query",
                "prop": "pageimages",
                "piprop": "original|thumbnail",
                "pithumbsize": "800",
                "format": "json",
                "redirects": "1",
                "titles": place_name.strip(),
            },
            headers={"User-Agent": _UA},
        )
    except httpx.HTTPError:
        return None
    if resp.status_code != 200:
        return None
    try:
        pages = (resp.json().get("query") or {}).get("pages") or {}
    except ValueError:
        return None

    for page in pages.values():
        src = (page.get("thumbnail") or {}).get("source") or (
            page.get("original") or {}
        ).get("source")
        if src:
            return src, f"Wikipedia — {page.get('title') or place_name}"
    return None


async def _unsplash_photo(client: httpx.AsyncClient, query: str) -> tuple[str, str] | None:
    key = get_settings().unsplash_access_key
    if not key:
        return None
    try:
        resp = await client.get(
            _UNSPLASH_SEARCH,
            params={
                "query": query,
                "per_page": 1,
                "orientation": "landscape",
                "content_filter": "high",
            },
            headers={"Authorization": f"Client-ID {key}"},
        )
    except httpx.HTTPError:
        return None
    if resp.status_code != 200:
        return None
    try:
        results = resp.json().get("results") or []
    except ValueError:
        return None
    if not results:
        return None
    photo = results[0]
    url = (photo.get("urls") or {}).get("regular")
    if not url:
        return None
    name = (photo.get("user") or {}).get("name") or "Unsplash"
    return url, f"Photo by {name} on Unsplash"


async def fetch_photo(
    place_name: str | None, destination: str, category: str
) -> tuple[str, str] | None:
    if not get_settings().photos_enabled:
        return None

    name = (place_name or "").strip()
    city = destination.split(",")[0].strip()
    async with httpx.AsyncClient(timeout=6, follow_redirects=True) as client:
        if name:
            hit = await _wikipedia_photo(client, name)
            if hit:
                return hit
        query = " ".join(p for p in (name or category, city) if p).strip()
        return await _unsplash_photo(client, query)
