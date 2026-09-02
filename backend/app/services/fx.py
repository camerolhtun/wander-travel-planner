"""Destination -> local currency, plus a best-effort live exchange rate.

Used to snapshot ``trips.local_currency`` / ``trips.fx_rate`` at generation time
so the UI can show costs in both the traveller's currency and the local one.
"""

import httpx

from app.config import get_settings

_RATES_URL = "https://open.er-api.com/v6/latest/{base}"

# Country / common alias -> ISO 4217 code. Keys are matched case-insensitively
# against the text after the last comma in the destination ("Kyoto, Japan").
_COUNTRY_CURRENCY: dict[str, str] = {
    "afghanistan": "AFN", "albania": "ALL", "algeria": "DZD", "andorra": "EUR",
    "angola": "AOA", "argentina": "ARS", "armenia": "AMD", "aruba": "AWG",
    "australia": "AUD", "austria": "EUR", "azerbaijan": "AZN", "bahamas": "BSD",
    "bahrain": "BHD", "bangladesh": "BDT", "barbados": "BBD", "belarus": "BYN",
    "belgium": "EUR", "belize": "BZD", "benin": "XOF", "bermuda": "BMD",
    "bhutan": "BTN", "bolivia": "BOB", "bosnia and herzegovina": "BAM",
    "botswana": "BWP", "brazil": "BRL", "brunei": "BND", "bulgaria": "BGN",
    "burkina faso": "XOF", "burundi": "BIF", "cambodia": "KHR", "cameroon": "XAF",
    "canada": "CAD", "cape verde": "CVE", "cayman islands": "KYD", "chile": "CLP",
    "china": "CNY", "colombia": "COP", "comoros": "KMF", "congo": "XAF",
    "costa rica": "CRC", "croatia": "EUR", "cuba": "CUP", "cyprus": "EUR",
    "czech republic": "CZK", "czechia": "CZK", "denmark": "DKK", "djibouti": "DJF",
    "dominican republic": "DOP", "ecuador": "USD", "egypt": "EGP",
    "el salvador": "USD", "estonia": "EUR", "eswatini": "SZL", "ethiopia": "ETB",
    "fiji": "FJD", "finland": "EUR", "france": "EUR", "gabon": "XAF",
    "gambia": "GMD", "georgia": "GEL", "germany": "EUR", "ghana": "GHS",
    "gibraltar": "GIP", "greece": "EUR", "greenland": "DKK", "guatemala": "GTQ",
    "guinea": "GNF", "guyana": "GYD", "haiti": "HTG", "honduras": "HNL",
    "hong kong": "HKD", "hungary": "HUF", "iceland": "ISK", "india": "INR",
    "indonesia": "IDR", "iran": "IRR", "iraq": "IQD", "ireland": "EUR",
    "israel": "ILS", "italy": "EUR", "ivory coast": "XOF", "cote d'ivoire": "XOF",
    "jamaica": "JMD", "japan": "JPY", "jordan": "JOD", "kazakhstan": "KZT",
    "kenya": "KES", "kosovo": "EUR", "kuwait": "KWD", "kyrgyzstan": "KGS",
    "laos": "LAK", "latvia": "EUR", "lebanon": "LBP", "lesotho": "LSL",
    "liberia": "LRD", "libya": "LYD", "liechtenstein": "CHF", "lithuania": "EUR",
    "luxembourg": "EUR", "macau": "MOP", "macao": "MOP", "madagascar": "MGA",
    "malawi": "MWK", "malaysia": "MYR", "maldives": "MVR", "mali": "XOF",
    "malta": "EUR", "mauritania": "MRU", "mauritius": "MUR", "mexico": "MXN",
    "moldova": "MDL", "monaco": "EUR", "mongolia": "MNT", "montenegro": "EUR",
    "morocco": "MAD", "mozambique": "MZN", "myanmar": "MMK", "burma": "MMK",
    "namibia": "NAD", "nepal": "NPR", "netherlands": "EUR", "new zealand": "NZD",
    "nicaragua": "NIO", "niger": "XOF", "nigeria": "NGN",
    "north macedonia": "MKD", "norway": "NOK", "oman": "OMR", "pakistan": "PKR",
    "palestine": "ILS", "panama": "USD", "papua new guinea": "PGK",
    "paraguay": "PYG", "peru": "PEN", "philippines": "PHP", "poland": "PLN",
    "portugal": "EUR", "puerto rico": "USD", "qatar": "QAR", "romania": "RON",
    "russia": "RUB", "russian federation": "RUB", "rwanda": "RWF",
    "saint lucia": "XCD", "samoa": "WST", "san marino": "EUR",
    "saudi arabia": "SAR", "senegal": "XOF", "serbia": "RSD", "seychelles": "SCR",
    "sierra leone": "SLL", "singapore": "SGD", "slovakia": "EUR",
    "slovenia": "EUR", "solomon islands": "SBD", "somalia": "SOS",
    "south africa": "ZAR", "south korea": "KRW", "korea": "KRW",
    "republic of korea": "KRW", "spain": "EUR", "sri lanka": "LKR",
    "sudan": "SDG", "suriname": "SRD", "sweden": "SEK", "switzerland": "CHF",
    "syria": "SYP", "taiwan": "TWD", "tajikistan": "TJS", "tanzania": "TZS",
    "thailand": "THB", "togo": "XOF", "tonga": "TOP",
    "trinidad and tobago": "TTD", "tunisia": "TND", "turkey": "TRY",
    "turkiye": "TRY", "turkmenistan": "TMT", "uganda": "UGX", "ukraine": "UAH",
    "united arab emirates": "AED", "uae": "AED",
    "united kingdom": "GBP", "uk": "GBP", "england": "GBP", "scotland": "GBP",
    "wales": "GBP", "great britain": "GBP", "britain": "GBP",
    "united states": "USD", "united states of america": "USD", "usa": "USD",
    "us": "USD", "america": "USD",
    "uruguay": "UYU", "uzbekistan": "UZS", "vanuatu": "VUV",
    "vatican": "EUR", "venezuela": "VES", "vietnam": "VND", "viet nam": "VND",
    "yemen": "YER", "zambia": "ZMW", "zimbabwe": "ZWL",
}


def _norm(s: str) -> str:
    return s.strip().lower().strip(".").replace("  ", " ")


def local_currency_for(destination: str | None) -> str | None:
    """Best-guess ISO 4217 code for a "City, Country" (or bare country) string."""
    if not destination:
        return None
    parts = [p.strip() for p in destination.split(",") if p.strip()]
    for cand in ([parts[-1]] if parts else []) + [destination]:
        hit = _COUNTRY_CURRENCY.get(_norm(cand))
        if hit:
            return hit
    return None


async def fetch_fx_rate(base: str, quote: str) -> float | None:
    """Units of ``quote`` per 1 ``base``. Returns None on any failure."""
    base = (base or "").upper().strip()
    quote = (quote or "").upper().strip()
    if not base or not quote or base == quote:
        return None
    if not get_settings().fx_rates_enabled:
        return None
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(_RATES_URL.format(base=base))
        if resp.status_code != 200:
            return None
        data = resp.json()
        if data.get("result") != "success":
            return None
        rate = (data.get("rates") or {}).get(quote)
        return float(rate) if rate else None
    except (httpx.HTTPError, ValueError, TypeError, KeyError):
        return None
