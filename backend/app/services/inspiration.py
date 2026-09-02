"""Travel-blog inspiration feed.

Per section we run a tuned Google News RSS search (no key) aimed at the kind
of piece people actually want here — "best beaches right now", "where to eat
in X", "festival calendar" — then keep only results whose headline is on
topic. Cached in-process ~45 min. All fetching is best-effort.
"""

import asyncio
import datetime as dt
import html
import re
import time

import feedparser
import httpx

from app.config import get_settings

_UA = "WanderTravelPlanner/1.0 (+https://github.com/camerolhtun/wander-travel-planner)"
_NEWS_URL = "https://news.google.com/rss/search"

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")

# query  -> the Google News search (kept focused on guide / when-to-go pieces)
# keywords -> at least one must appear in the headline, or we drop it
# recency -> Google News `when:` window
SECTIONS: dict[str, dict] = {
    "beach": {
        "label": "Beach",
        "blurb": "Where to find sand and warm water right now — guides and tips from around the web.",
        "query": '("best beaches" OR "best islands" OR "beach destinations" OR "island getaway" OR "when to visit") beach travel',
        "keywords": (
            "beach", "beaches", "island", "islands", "coast", "coastal", "shore",
            "seaside", "snorkel", "reef", "riviera", "lagoon", "surf", "sandbar",
        ),
        "recency": "60d",
    },
    "mountain": {
        "label": "Mountain",
        "blurb": "Trails, peaks and mountain towns — where and when to go.",
        "query": '("best hikes" OR "hiking trails" OR "mountain towns" OR "ski resorts" OR "best time to hike") travel',
        "keywords": (
            "mountain", "mountains", "hike", "hiking", "hikes", "trail", "trails",
            "trek", "trekking", "alps", "alpine", "ski", "skiing", "summit",
            "peak", "peaks", "dolomites", "andes", "himalaya", "national park",
        ),
        "recency": "60d",
    },
    "culture": {
        "label": "Culture",
        "blurb": "Cities, history and heritage — what to see and when.",
        "query": '("historic cities" OR "cultural destinations" OR "museums to visit" OR "world heritage site" OR "old town") travel',
        "keywords": (
            "culture", "cultural", "history", "historic", "heritage", "museum",
            "museums", "old town", "unesco", "temple", "temples", "ruins",
            "palace", "castle", "cathedral", "ancient", "art",
        ),
        "recency": "60d",
    },
    "food": {
        "label": "Food",
        "blurb": "The world's best places to eat and drink — city guides and food trails.",
        "query": '("best food cities" OR "food guide" OR "where to eat" OR "culinary travel" OR "street food") travel',
        "keywords": (
            "food", "eat", "eating", "restaurant", "restaurants", "culinary",
            "cuisine", "dish", "dishes", "street food", "michelin", "dining",
            "wine", "coffee", "bakery", "market", "chef", "tasting",
        ),
        "recency": "60d",
    },
    "festivals": {
        "label": "Festivals",
        "blurb": "Carnivals, lantern nights and harvest fairs — plan a trip around a festival.",
        "query": '("festivals to visit" OR "best festivals" OR "festival calendar" OR "cultural festivals" OR "music festivals") travel',
        "keywords": (
            "festival", "festivals", "carnival", "carnaval", "parade", "fiesta",
            "celebration", "fair", "holi", "diwali", "oktoberfest", "mardi gras",
            "lantern", "new year", "pride", "harvest",
        ),
        "recency": "180d",
    },
}

# Headlines that match a topic keyword but aren't travel inspiration.
_NEGATIVE = (
    "buy a home", "real estate", "for sale", "prices rise", "housing market",
    "mortgage", "road closure", "bridge closing", "bridge closed", "lane closure",
    "arrested", "lawsuit", "obituary", "shooting", "crash", "sentenced",
    "layoffs", "earnings", "stock", "recall",
)
_BLOCK_SOURCES = {"rus tourism news", "tycoonstory.com", "safariindia.com"}

_TTL = 45 * 60
_cache: dict[str, tuple[float, list[dict]]] = {}
_locks: dict[str, asyncio.Lock] = {}


def _strip_html(s: str) -> str:
    return _WS_RE.sub(" ", html.unescape(_TAG_RE.sub(" ", s or ""))).strip()


def _published_iso(entry: feedparser.FeedParserDict) -> str | None:
    st = entry.get("published_parsed") or entry.get("updated_parsed")
    if not st:
        return None
    try:
        return dt.datetime(*st[:6], tzinfo=dt.timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def _split_headline(raw_title: str, entry: feedparser.FeedParserDict) -> tuple[str, str]:
    """Google News titles read 'Headline - Publisher'; peel the publisher off."""
    src = ""
    s = entry.get("source")
    if isinstance(s, dict):
        src = (s.get("title") or "").strip()
    elif isinstance(s, str):
        src = s.strip()

    title = raw_title
    if src and title.endswith(f" - {src}"):
        title = title[: -len(f" - {src}")].strip()
    elif not src and " - " in raw_title:
        title, src = (p.strip() for p in raw_title.rsplit(" - ", 1))
    return title or raw_title, src


async def _fetch_section(client: httpx.AsyncClient, section: str) -> list[dict]:
    cfg = SECTIONS[section]
    params = {
        "q": f"{cfg['query']} when:{cfg['recency']}",
        "hl": "en-US",
        "gl": "US",
        "ceid": "US:en",
    }
    try:
        resp = await client.get(_NEWS_URL, params=params, headers={"User-Agent": _UA})
    except httpx.HTTPError:
        return []
    if resp.status_code != 200:
        return []

    parsed = feedparser.parse(resp.content)
    keywords = cfg["keywords"]
    out: list[dict] = []
    seen: set[str] = set()
    for entry in parsed.entries[:80]:
        raw_title = _strip_html(entry.get("title") or "")
        link = (entry.get("link") or "").strip()
        if not raw_title or not link:
            continue
        title, source = _split_headline(raw_title, entry)
        low = title.lower()
        if not any(k in low for k in keywords):
            continue  # headline isn't actually about this topic
        if any(n in low for n in _NEGATIVE):
            continue
        if source.lower() in _BLOCK_SOURCES:
            continue
        if low in seen:
            continue
        seen.add(low)
        out.append(
            {
                "title": title,
                "url": link,
                "source": source or "Google News",
                "summary": None,
                "image": None,
                "published_at": _published_iso(entry),
            }
        )
    return out


async def get_inspiration(section: str, limit: int = 24) -> list[dict]:
    key = section.strip().lower()
    if key not in SECTIONS or not get_settings().inspiration_enabled:
        return []

    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < _TTL:
        return hit[1][:limit]

    lock = _locks.setdefault(key, asyncio.Lock())
    async with lock:
        hit = _cache.get(key)
        if hit and time.time() - hit[0] < _TTL:
            return hit[1][:limit]
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
            items = await _fetch_section(client, key)
        items.sort(key=lambda it: it["published_at"] or "", reverse=True)
        _cache[key] = (time.time(), items)
        return items[:limit]
