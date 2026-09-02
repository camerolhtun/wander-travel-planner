export type City = { n: string; c: string; a?: string };

let cache: City[] | null = null;
let pending: Promise<City[]> | null = null;

/** Lazy-load the bundled city list (~140KB) only when the field is used. */
export function loadCities(): Promise<City[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = import("@/lib/cities.json").then((m) => {
      cache = (m.default ?? m) as unknown as City[];
      return cache;
    });
  }
  return pending;
}

const DIACRITICS = /[\u0300-\u036f]/g;

const norm = (s: string) =>
  s.normalize("NFD").replace(DIACRITICS, "").toLowerCase().trim();

export function label(city: City): string {
  return `${city.n}, ${city.c}`;
}

/** Prefix matches (city or ascii alias) first, then substring, in popularity order. */
export function searchCities(list: City[], query: string, limit = 7): City[] {
  const q = norm(query);
  if (q.length < 1) return [];
  const starts: City[] = [];
  const contains: City[] = [];
  for (const city of list) {
    const n = norm(city.n);
    const a = city.a ? norm(city.a) : "";
    if (n.startsWith(q) || a.startsWith(q)) {
      starts.push(city);
      if (starts.length >= limit) break;
    } else if (contains.length < limit && norm(label(city)).includes(q)) {
      contains.push(city);
    }
  }
  return [...starts, ...contains].slice(0, limit);
}
