"""Travel-blog inspiration feed.

Aggregates a handful of reputable travel-publication RSS feeds, tags each
article by interest from keywords, and serves the freshest per interest.
All fetching is best-effort — a dead or slow feed is skipped. Results are
cached in-process for ~45 minutes so we stay polite to the feed hosts.
"""

import asyncio
import datetime as dt
import html
import re
import time
from urllib.parse import urlparse

import feedparser
import httpx

from app.config import get_settings

_UA = "WanderTravelPlanner/1.0 (+https://github.com/camerolhtun/wander-travel-planner)"

# Curated travel publications with open RSS feeds.
_FEEDS: list[str] = [
    "https://www.nomadicmatt.com/travel-blog/feed/",
    "https://thepointsguy.com/feed/",
    "https://www.theblondeabroad.com/feed/",
    "https://www.adventurouskate.com/feed/",
    "https://expertvagabond.com/feed/",
    "https://www.saltinourhair.com/feed/",
    "https://matadornetwork.com/feed/",
    "https://www.atlasobscura.com/feeds/latest-articles.rss",
    "https://www.travelandleisure.com/feeds/all/rss.xml",
    "https://www.cntraveler.com/feed/rss",
    "https://www.lonelyplanet.com/news/feed",
    "https://www.thetravelmagazine.net/feed/",
]

INTEREST_KEYWORDS: dict[str, tuple[str, ...]] = {
    "beach": (
        "beach", "beaches", "island", "islands", "coast", "coastal", "seaside",
        "snorkel", "scuba", "diving", "reef", "tropical", "lagoon", "surf",
        "caribbean", "maldives", "bali", "cancun", "hawaii", "phuket", "riviera",
        "shore", "sailing", "sandbar",
    ),
    "mountain": (
        "mountain", "mountains", "hike", "hiking", "trek", "trekking", "trail",
        "trails", "alps", "alpine", "himalaya", "andes", "rockies", "dolomites",
        "patagonia", "summit", "peak", "ski", "skiing", "snowboard", "climbing",
        "national park", "backcountry", "valley", "glacier",
    ),
    "culture": (
        "museum", "museums", "history", "historic", "heritage", "temple",
        "cathedral", "ruins", "old town", "architecture", "gallery", "festival",
        "cuisine", "food scene", "market", "unesco", "palace", "castle",
        "cultural", "tradition", "ancient", "monastery",
    ),
}

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)
_BOILER_RE = re.compile(
    r"\s*(the post .*? appeared first on .*?\.?$"
    r"|continue reading.*$"
    r"|read more.*$"
    r"|\[[….]+\]$"
    r"|[….]{3}$)",
    re.I,
)

_POOL_TTL = 45 * 60
_pool: tuple[float, list[dict]] | None = None
_lock = asyncio.Lock()


def _strip_html(s: str) -> str:
    return _WS_RE.sub(" ", html.unescape(_TAG_RE.sub(" ", s or ""))).strip()


def _clean_summary(s: str) -> str:
    s = _strip_html(s)
    prev = None
    while prev != s:  # boilerplate can stack (…  Continue reading)
        prev = s
        s = _BOILER_RE.sub("", s).strip()
    return s


def _source_name(parsed: feedparser.FeedParserDict, url: str) -> str:
    title = (parsed.feed.get("title") or "").strip()
    if title:
        return title
    host = urlparse(url).netloc.replace("www.", "")
    return host or "Travel blog"


def _entry_image(entry: feedparser.FeedParserDict) -> str | None:
    for mc in entry.get("media_content", []) or []:
        if mc.get("url"):
            return mc["url"]
    for mt in entry.get("media_thumbnail", []) or []:
        if mt.get("url"):
            return mt["url"]
    for enc in entry.get("enclosures", []) or []:
        if (enc.get("type") or "").startswith("image") and enc.get("href"):
            return enc["href"]
    body = ""
    if entry.get("content"):
        body = entry["content"][0].get("value", "")
    body = body or entry.get("summary", "")
    m = _IMG_RE.search(body or "")
    return m.group(1) if m else None


def _published_iso(entry: feedparser.FeedParserDict) -> str | None:
    st = entry.get("published_parsed") or entry.get("updated_parsed")
    if not st:
        return None
    try:
        return dt.datetime(*st[:6], tzinfo=dt.timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


async def _fetch_feed(client: httpx.AsyncClient, url: str) -> list[dict]:
    try:
        resp = await client.get(url, headers={"User-Agent": _UA})
    except httpx.HTTPError:
        return []
    if resp.status_code != 200:
        return []

    parsed = feedparser.parse(resp.content)
    source = _source_name(parsed, url)
    out: list[dict] = []
    for entry in parsed.entries[:25]:
        link = (entry.get("link") or "").strip()
        title = _strip_html(entry.get("title") or "")
        if not link or not title:
            continue
        summary = _clean_summary(entry.get("summary") or entry.get("description") or "")
        tags = " ".join(t.get("term", "") for t in entry.get("tags", []) or [])
        haystack = f"{title} {summary} {tags}".lower()
        interests = [
            key
            for key, words in INTEREST_KEYWORDS.items()
            if any(w in haystack for w in words)
        ]
        if not interests:
            continue
        out.append(
            {
                "title": title,
                "url": link,
                "source": source,
                "summary": summary[:240] or None,
                "image": _entry_image(entry),
                "published_at": _published_iso(entry),
                "interests": interests,
            }
        )
    return out


async def _load_pool() -> list[dict]:
    global _pool
    if not get_settings().inspiration_enabled:
        return []
    now = time.time()
    if _pool and now - _pool[0] < _POOL_TTL:
        return _pool[1]
    async with _lock:
        if _pool and time.time() - _pool[0] < _POOL_TTL:
            return _pool[1]
        sem = asyncio.Semaphore(6)

        async def one(client: httpx.AsyncClient, u: str) -> list[dict]:
            async with sem:
                return await _fetch_feed(client, u)

        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
            batches = await asyncio.gather(
                *(one(client, u) for u in _FEEDS), return_exceptions=True
            )

        seen: set[str] = set()
        items: list[dict] = []
        for batch in batches:
            if isinstance(batch, BaseException):
                continue
            for it in batch:
                if it["url"] in seen:
                    continue
                seen.add(it["url"])
                items.append(it)
        items.sort(key=lambda it: it["published_at"] or "", reverse=True)
        _pool = (time.time(), items)
        return items


async def get_inspiration(interest: str, limit: int = 24) -> list[dict]:
    key = interest.strip().lower()
    if key not in INTEREST_KEYWORDS:
        return []
    pool = await _load_pool()
    return [it for it in pool if key in it["interests"]][:limit]
