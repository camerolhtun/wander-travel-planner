"""Best-effort place photos.

Per item we gather a small gallery. Unsplash results lead (nicer, more
travel-inspiring shots) when a key is configured; images from the matching
Wikipedia article follow — and jump ahead if Unsplash's best is much
lower-resolution.

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

# Activity words that make an image search vague — a place/subject reads better.
_FILLER = {
    "crawl", "tour", "tours", "visit", "explore", "exploring", "sample",
    "sampling", "various", "walk", "walking", "day", "trip", "experience",
    "guided", "self", "hop", "stroll", "adventure", "discovery", "session",
    "morning", "afternoon", "evening", "night", "optional", "free", "time",
    "the", "and", "for", "with", "your", "our", "a", "an", "of", "at", "to",
}


def _clean_query(text: str) -> str:
    words = [
        w for w in re.split(r"[^A-Za-z0-9]+", text) if w and w.lower() not in _FILLER
    ]
    return " ".join(words)


def _basename(url: str) -> str:
    """Stable key for de-duping (drops query string + thumbnail size prefix)."""
    seg = url.split("?", 1)[0].rsplit("/", 1)[-1]
    return re.sub(r"^\d+px-", "", seg).lower()


def _tokens(text: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", text.lower()) if len(t) >= 4]


async def _wikipedia_lead(
    client: httpx.AsyncClient, place_name: str
) -> tuple[str, str, int] | None:
    try:
        resp = await client.get(
            _WIKI_API,
            params={
                "action": "query",
                "prop": "pageimages",
                "piprop": "original|thumbnail",
                "pithumbsize": "1400",
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
        for key in ("thumbnail", "originalimage"):
            img = page.get(key) or {}
            if img.get("source"):
                title = page.get("title") or place_name
                return img["source"], f"Wikipedia — {title}", img.get("width") or 0
    return None


async def _wikipedia_gallery(
    client: httpx.AsyncClient, place_name: str, limit: int
) -> list[tuple[str, str, int]]:
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
                "iiurlwidth": "1400",
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
    scored: list[tuple[int, str, str]] = []
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
        width = info.get("width") or 0
        height = info.get("height") or 1
        if width < 600:  # skip thumbnails / low-res scans
            continue
        ratio = width / height
        if ratio < 0.7 or ratio > 2.4:  # skip portraits & panoramas — crop badly
            continue
        url = info.get("thumburl") or info.get("url")
        if not url:
            continue
        # Effective rendered width — what actually reaches the browser.
        eff_w = info.get("thumbwidth") or width
        name = title.removeprefix("File:")
        scored.append((eff_w, url, f"Wikimedia Commons — {name}"))

    # Crispest first.
    scored.sort(key=lambda t: t[0], reverse=True)
    return [(url, attr, w) for w, url, attr in scored[:limit]]


_UNSPLASH_RENDER = 1400  # px wide we ask Unsplash's CDN to render


async def _unsplash_gallery(
    client: httpx.AsyncClient, query: str, count: int
) -> list[tuple[str, str, int]]:
    key = get_settings().unsplash_access_key
    if not key or count <= 0:
        return []
    try:
        resp = await client.get(
            _UNSPLASH_SEARCH,
            params={
                "query": query,
                "per_page": "24",
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

    scored: list[tuple[int, str, str, int]] = []
    for photo in results:
        urls = photo.get("urls") or {}
        raw = urls.get("raw")
        url = f"{raw}&w={_UNSPLASH_RENDER}&q=80&fm=jpg&fit=max" if raw else urls.get("regular")
        if not url:
            continue
        width = photo.get("width") or 0
        height = photo.get("height") or 1
        if width < 800:  # genuinely small uploads only
            continue
        ratio = width / height
        if ratio < 0.9 or ratio > 2.2:  # skip portraits & panoramas
            continue
        # Effective width the browser gets (Unsplash won't upscale past source).
        eff_w = min(width, _UNSPLASH_RENDER)
        who = (photo.get("user") or {}).get("name") or "Unsplash"
        scored.append((photo.get("likes") or 0, url, f"Photo by {who} on Unsplash", eff_w))

    # Most-liked first — a decent proxy for "well-composed, not murky".
    scored.sort(key=lambda t: t[0], reverse=True)
    return [(url, attr, w) for _, url, attr, w in scored[:count]]


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
        wiki: list[tuple[str, str, int]] = []
        if name:
            lead = await _wikipedia_lead(client, name)
            if lead:
                wiki.append(lead)
            wiki.extend(await _wikipedia_gallery(client, name, limit))

        query = _clean_query(f"{name or category} {city}") or city or category
        unsplash = await _unsplash_gallery(client, query, limit)

        # Unsplash leads (nicer travel shots) unless its best image is much
        # lower-res than what Wikipedia can offer — then Wikipedia goes first.
        best_wiki_w = max((w for *_, w in wiki), default=0)
        top_unsplash_w = unsplash[0][2] if unsplash else 0
        unsplash_leads = bool(unsplash) and (
            best_wiki_w == 0 or top_unsplash_w >= 0.65 * best_wiki_w
        )
        ordered = unsplash + wiki if unsplash_leads else wiki + unsplash

    for url, attr, _w in ordered:
        add(url, attr)

    return out[:limit]
