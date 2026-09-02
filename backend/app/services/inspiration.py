"""Travel-blog inspiration feed.

Per section we run a tuned Bing News RSS search (no key) aimed at the kind of
piece people want here — "best beaches now", "where to eat in X", "festival
calendar" — keep only headlines that are actually on topic, then fetch each
article's og:image for a thumbnail. Cached in-process ~45 min, best-effort.
"""

import asyncio
import datetime as dt
import html
import re
import time
from urllib.parse import parse_qs, quote, urljoin, urlparse

import feedparser
import httpx

from app.config import get_settings

_BING_URL = "https://www.bing.com/news/search"
_BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_TRAIL_RE = re.compile(r"\s*[.…]{2,}\s*$")
_IMG_META = (
    re.compile(
        r'<meta[^>]+(?:property|name|itemprop)=["\']'
        r'(?:og:image(?::url|:secure_url)?|twitter:image(?::src)?|image)["\']'
        r'[^>]+content=["\']([^"\']+)',
        re.I,
    ),
    re.compile(
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name|itemprop)=["\']'
        r'(?:og:image(?::url|:secure_url)?|twitter:image(?::src)?|image)["\']',
        re.I,
    ),
    re.compile(r'<link[^>]+rel=["\']image_src["\'][^>]+href=["\']([^"\']+)', re.I),
)

# queries  -> Bing News searches (merged); broad enough for volume
# keywords -> at least one must appear in the headline, or we drop it
SECTIONS: dict[str, dict] = {
    "beach": {
        "label": "Beach",
        "blurb": "Where to find sand and warm water right now — guides and tips from around the web.",
        "queries": (
            "best beaches to visit travel",
            "best islands travel guide",
            "beach destination guide when to visit",
        ),
        "keywords": (
            "beach", "beaches", "island", "islands", "coast", "coastal", "shore",
            "seaside", "snorkel", "reef", "riviera", "lagoon", "surf",
        ),
    },
    "mountain": {
        "label": "Mountain",
        "blurb": "Trails, peaks and mountain towns — where and when to go.",
        "queries": (
            "best mountain destinations travel",
            "best hikes travel guide",
            "best ski towns mountain travel",
        ),
        "keywords": (
            "mountain", "mountains", "hike", "hiking", "hikes", "trail", "trails",
            "trek", "trekking", "alps", "alpine", "ski", "skiing", "summit",
            "peak", "peaks", "dolomites", "andes", "himalaya", "national park",
            "lake", "lakes", "valley",
        ),
    },
    "culture": {
        "label": "Culture",
        "blurb": "Cities, history and heritage — what to see and when.",
        "queries": (
            "best cultural destinations travel",
            "historic cities travel guide",
            "world heritage travel guide",
        ),
        "keywords": (
            "culture", "cultural", "history", "historic", "heritage", "museum",
            "museums", "old town", "unesco", "temple", "temples", "ruins",
            "palace", "castle", "cathedral", "ancient", "art",
        ),
    },
    "food": {
        "label": "Food",
        "blurb": "The world's best places to eat and drink — city guides and food trails.",
        "queries": (
            "best food cities travel guide",
            "where to eat travel guide",
            "street food travel guide",
        ),
        "keywords": (
            "food", "eat", "eats", "eating", "restaurant", "restaurants", "culinary",
            "cuisine", "dish", "dishes", "street food", "michelin", "dining",
            "wine", "coffee", "bakery", "chef", "tasting", "brunch",
        ),
    },
    "festivals": {
        "label": "Festivals",
        "blurb": "Carnivals, lantern nights and harvest fairs — plan a trip around a festival.",
        "queries": (
            "best festivals to travel to",
            "festival travel guide",
            "cultural festivals around the world travel",
        ),
        "keywords": (
            "festival", "festivals", "carnival", "carnaval", "parade", "fiesta",
            "celebration", "fair", "holi", "diwali", "oktoberfest", "mardi gras",
            "lantern", "new year", "harvest",
        ),
    },
}

# Headlines that match a topic keyword but aren't travel inspiration.
_NEGATIVE = (
    "buy a home", "real estate", "for sale", "prices rise", "housing market",
    "mortgage", "road closure", "bridge closing", "lane closure", "arrested",
    "lawsuit", "obituary", "shooting", "crash", "sentenced", "layoffs",
    "earnings", "stock", "recall", "press release", "pr newswire", "prnewswire",
    "globenewswire", "business wire",
)
_BLOCK_SOURCES = {"rus tourism news", "tycoonstory.com", "safariindia.com"}

_TTL = 45 * 60
_cache: dict[str, tuple[float, list[dict]]] = {}
_locks: dict[str, asyncio.Lock] = {}


def _strip_html(s: str) -> str:
    return _WS_RE.sub(" ", html.unescape(_TAG_RE.sub(" ", s or ""))).strip()


def _clean_summary(s: str) -> str | None:
    s = _TRAIL_RE.sub("", _strip_html(s)).strip()
    return s or None


def _published_iso(entry: feedparser.FeedParserDict) -> str | None:
    st = entry.get("published_parsed") or entry.get("updated_parsed")
    if not st:
        return None
    try:
        return dt.datetime(*st[:6], tzinfo=dt.timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def _real_url(bing_link: str) -> str:
    """Bing wraps links as apiclick.aspx?...&url=<encoded real url>&..."""
    try:
        url = parse_qs(urlparse(bing_link).query).get("url", [None])[0]
        return url or bing_link
    except ValueError:
        return bing_link


def _source(entry: feedparser.FeedParserDict, real_url: str) -> str:
    name = re.sub(
        r"\s+on\s+MSN(\.com)?$", "", (entry.get("news_source") or "").strip(), flags=re.I
    ).strip()
    if name and name.lower() not in {"amazon s3", "msn", ""}:
        return name
    host = urlparse(real_url).netloc.replace("www.", "")
    return host or "Web"


async def _bing_search(client: httpx.AsyncClient, query: str) -> list[feedparser.FeedParserDict]:
    try:
        resp = await client.get(
            _BING_URL,
            params={"q": query, "format": "rss", "mkt": "en-US"},
            headers={"User-Agent": _BROWSER_UA},
        )
    except httpx.HTTPError:
        return []
    if resp.status_code != 200:
        return []
    return feedparser.parse(resp.content).entries


async def _fetch_section(client: httpx.AsyncClient, section: str) -> list[dict]:
    cfg = SECTIONS[section]
    keywords = cfg["keywords"]
    batches = await asyncio.gather(
        *(_bing_search(client, q) for q in cfg["queries"]), return_exceptions=True
    )

    out: list[dict] = []
    seen: set[str] = set()
    for batch in batches:
        if isinstance(batch, BaseException):
            continue
        for entry in batch:
            title = _strip_html(entry.get("title") or "")
            real = _real_url((entry.get("link") or "").strip())
            if not title or not real.startswith("http") or real in seen:
                continue
            low = title.lower()
            if not any(k in low for k in keywords):
                continue  # headline isn't actually about this topic
            if any(n in low for n in _NEGATIVE):
                continue
            source = _source(entry, real)
            if source.lower() in _BLOCK_SOURCES:
                continue
            seen.add(real)
            out.append(
                {
                    "title": title,
                    "url": real,
                    "source": source,
                    "summary": _clean_summary(entry.get("summary") or ""),
                    "image": None,
                    "published_at": _published_iso(entry),
                }
            )
    return out


# Hosts that bot-wall or redirect-loop — not worth the wait for an og:image.
_SKIP_THUMB_HOSTS = ("msn.com", "aol.com", "yahoo.com")


async def _thumbnail(client: httpx.AsyncClient, page_url: str) -> str | None:
    if any(h in urlparse(page_url).netloc.lower() for h in _SKIP_THUMB_HOSTS):
        return None
    try:
        resp = await client.get(
            page_url,
            headers={
                "User-Agent": _BROWSER_UA,
                "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
            },
            timeout=6,
        )
    except (httpx.HTTPError, UnicodeError):
        return None
    if resp.status_code != 200:
        return None

    try:
        head = resp.text[:100_000]
    except (UnicodeError, ValueError):
        return None
    src = ""
    for pattern in _IMG_META:
        m = pattern.search(head)
        if m:
            src = m.group(1).strip()
            break
    if not src or src.lower().split("?")[0].endswith(".svg"):
        return None
    if src.startswith("//"):
        src = "https:" + src
    elif src.startswith("/"):
        src = urljoin(page_url, src)
    return src if src.startswith("http") else None


def _screenshot(url: str) -> str:
    """WordPress mShots — a keyless page screenshot, our thumbnail fallback."""
    return f"https://s.wordpress.com/mshots/v1/{quote(url, safe='')}?w=640&h=400"


async def _add_thumbnails(client: httpx.AsyncClient, items: list[dict]) -> None:
    """Prefer the article's own og:image; fall back to a page screenshot."""
    sem = asyncio.Semaphore(12)

    async def one(it: dict) -> None:
        async with sem:
            it["image"] = await _thumbnail(client, it["url"])

    try:
        await asyncio.wait_for(
            asyncio.gather(*(one(it) for it in items), return_exceptions=True),
            timeout=12,
        )
    except asyncio.TimeoutError:
        pass

    shots: list[str] = []
    for it in items:
        if not it["image"]:
            it["image"] = _screenshot(it["url"])
            shots.append(it["image"])

    # Nudge mShots to start rendering so viewers get the real shot, not the
    # "generating" placeholder. Best-effort, tightly bounded.
    if shots:
        async def hit(u: str) -> None:
            try:
                await client.get(u, timeout=8)
            except (httpx.HTTPError, UnicodeError):
                pass

        try:
            await asyncio.wait_for(
                asyncio.gather(*(hit(u) for u in shots), return_exceptions=True),
                timeout=6,
            )
        except asyncio.TimeoutError:
            pass


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
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            items = await _fetch_section(client, key)
            items.sort(key=lambda it: it["published_at"] or "", reverse=True)
            items = items[:limit]
            await _add_thumbnails(client, items)
        _cache[key] = (time.time(), items)
        return items
