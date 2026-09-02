"""Best-effort place photos.

Per item we gather a small gallery: real images from the matching Wikipedia
article first, topped up with Unsplash search results (stock photos of the
vibe) when an Unsplash key is configured.

``fetch_photos`` returns ``[{"url": ..., "attribution": ...}, ...]`` (possibly
empty). Never raises.
"""

import re

import httpx

from app.config import get_settings

_WIKI_API = "https://en.wikipedia.org/w/api.php"
_UNSPLASH_SEARCH = "https://api.unsplash.com/search/photos"
_UA = "WanderTravelPlanner/1.0 (https://github.com/camerolhtun/wander-travel-planner)"

# Article images that aren't photos of the place.
_JUNK = re.compile(
    r"(logo|icon|map|flag|coat[_ ]of[_ ]arms|seal|diagram|locator|wikimedia|"
    r"commons-|edit-|ambox|question_book|osm|openstreetmap|blank|\.svg$)",
    re.I,
)


def _basename(url: str) -> str:
    """Stable key for de-duping (drops query string + thumbnail size prefix)."""
    seg = url.split("?", 1)[0].rsplit("/", 1)[-1]
    return re.sub(r"^\d+px-", "", seg).lower()


def _tokens(text: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", text.lower()) if len(t) >= 4]


async def _wikipedia_lead(client: httpx.AsyncClient, place_name: str) -> tuple[str, str] | None:
    try:
        resp = await client.get(
            _WIKI_API,
            params={
                "action": "query",
                "prop": "pageimages",
                "piprop": "original|thumbnail",
                "pithumbsize": "1000",
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


async def _wikipedia_gallery(
    client: httpx.AsyncClient, place_name: str, limit: int
) -> list[tuple[str, str]]:
    try:
        resp = await client.get(
            _WIKI_API,
            params={
                "action": "query",
                "format": "json",
                "redirects": "1",
                "titles": place_name.strip(),
                "generator": "images",
                "gimlimit": "40",
                "prop": "imageinfo",
                "iiprop": "url|mime|size",
                "iiurlwidth": "1000",
            },
            headers={"User-Agent": _UA},
        )
    except httpx.HTTPError:
        return []
    if resp.status_code != 200:
        return []
    try:
        pages = (resp.json().get("query") or {}).get("pages") or {}
    except ValueError:
        return []

    name_tokens = _tokens(place_name)
    out: list[tuple[str, str]] = []
    for page in pages.values():
        title = page.get("title", "")
        if _JUNK.search(title):
            continue
        # Keep only images whose filename echoes the place — drops the
        # tangential "see also" images the article also embeds.
        low = title.lower()
        if name_tokens and not any(tok in low for tok in name_tokens):
            continue
        info = (page.get("imageinfo") or [{}])[0]
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        if (info.get("width") or 0) < 250:
            continue
        url = info.get("thumburl") or info.get("url")
        if not url:
            continue
        name = title.removeprefix("File:")
        out.append((url, f"Wikimedia Commons — {name}"))
        if len(out) >= limit:
            break
    return out


async def _unsplash_gallery(
    client: httpx.AsyncClient, query: str, count: int
) -> list[tuple[str, str]]:
    key = get_settings().unsplash_access_key
    if not key or count <= 0:
        return []
    try:
        resp = await client.get(
            _UNSPLASH_SEARCH,
            params={
                "query": query,
                "per_page": min(count, 10),
                "orientation": "landscape",
                "content_filter": "high",
            },
            headers={"Authorization": f"Client-ID {key}"},
        )
    except httpx.HTTPError:
        return []
    if resp.status_code != 200:
        return []
    try:
        results = resp.json().get("results") or []
    except ValueError:
        return []
    out: list[tuple[str, str]] = []
    for photo in results:
        url = (photo.get("urls") or {}).get("regular")
        if not url:
            continue
        who = (photo.get("user") or {}).get("name") or "Unsplash"
        out.append((url, f"Photo by {who} on Unsplash"))
    return out


async def fetch_photos(
    place_name: str | None, destination: str, category: str, limit: int = 6
) -> list[dict[str, str]]:
    if not get_settings().photos_enabled:
        return []

    name = (place_name or "").strip()
    city = destination.split(",")[0].strip()
    out: list[dict[str, str]] = []
    seen: set[str] = set()

    def add(url: str, attribution: str) -> None:
        key = _basename(url)
        if url and key not in seen:
            seen.add(key)
            out.append({"url": url, "attribution": attribution})

    async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
        if name:
            lead = await _wikipedia_lead(client, name)
            if lead:
                add(*lead)
            for url, attr in await _wikipedia_gallery(client, name, limit):
                add(url, attr)

        if len(out) < limit:
            query = " ".join(p for p in (name or category, city) if p)
            for url, attr in await _unsplash_gallery(client, query, limit - len(out)):
                add(url, attr)

    return out[:limit]
