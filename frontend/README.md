# Frontend — AI Travel Planner

Next.js 15 (App Router) · TypeScript · Tailwind v4 · TanStack Query. Supabase is used
**only** for auth; all data flows through the FastAPI API in `../backend`.

## Setup

```bash
npm install
cp .env.local.example .env.local   # add Supabase URL + anon key when ready
npm run dev                        # http://localhost:3000
```

The app runs without Supabase configured — you just can't sign in. To exercise the
full flow before Supabase exists, set `NEXT_PUBLIC_DEV_USER_ID` in `.env.local` to any
UUID; the API client then sends it as `X-Dev-User` and the backend (with
`ENVIRONMENT=development`) treats requests as that user. Remove it once Supabase auth
is wired.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/login` | Magic link + Google sign-in |
| `/trips` | Saved trips list |
| `/trips/new` | The planning form (7 inputs) → create + generate |
| `/trips/[id]` | Day-by-day itinerary: inline edit items & day summary, add/delete items, reorder (↑/↓), Regenerate, Delete trip |
| `/trips/[id]/edit` | Edit trip parameters |
| `/auth/callback` | OAuth / magic-link code exchange |

## Key files

- `src/lib/api.ts` — typed client for every backend endpoint (incl. the Week 2 edit routes)
- `src/lib/types.ts` — TS mirror of the backend Pydantic schemas
- `src/lib/supabase/` — browser + server Supabase clients

## Deploy (Vercel)

Import `frontend/` as the project root. Env vars: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (your Railway URL).
