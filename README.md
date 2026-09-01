# AI Travel Itinerary Planner

Enter a destination, dates, budget, and preferences → get a day-by-day itinerary with
recommended attractions, food/activity suggestions, and an estimated daily budget.
Trips are saved per user and the itinerary is editable.

## Architecture

```
Next.js 15 (Vercel)  --Supabase JWT-->  FastAPI (Railway)  --asyncpg-->  Supabase Postgres
      |  Supabase Auth (login only)            |  Gemini API (structured JSON itinerary)
      |                                        |  Google Places API (optional enrichment)
```

- **Frontend** (`frontend/`): Next.js 15 App Router, TypeScript, Tailwind v4, TanStack Query.
  Uses Supabase only for auth; all data goes through the FastAPI API.
- **Backend** (`backend/`): FastAPI, SQLAlchemy 2.0 async, Alembic, PyJWT. Owns all business
  logic, DB writes, and external API calls. Secrets never reach the browser.
- **Database**: Supabase Postgres. Alembic manages the `public` tables; Supabase manages `auth`.

## Data model

`trips` → `itinerary_days` → `itinerary_items`. The `is_user_edited` flag on days and items
lets "Regenerate" replace AI content while preserving anything you changed by hand.

## Quick start (local)

Prereqs: Python 3.12+, Node 20+, and Postgres — `docker compose up -d db`, or
`brew install postgresql@16 && brew services start postgresql@16 && createdb travel_planner`,
or a Supabase project.

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env           # set DATABASE_URL; works with mock data, no keys needed
alembic upgrade head
uvicorn app.main:app --reload   # http://localhost:8000/docs

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local          # set NEXT_PUBLIC_API_URL
# to use the app before Supabase exists, also set NEXT_PUBLIC_DEV_USER_ID to any UUID
npm run dev                                # http://localhost:3000
```

Without a `GEMINI_API_KEY` the backend returns a deterministic mock itinerary, so the whole
flow is testable before any keys exist. See `supabase/README.md` for getting the keys.

## Status

**Working end to end** (verified against local Postgres): trip form → itinerary generation →
day-by-day view → inline edit of items and day summaries → add/delete items → reorder →
regenerate (preserving hand-edited days) → edit trip params → delete trip. Light/dark theme,
loading skeletons, optimistic edits, mobile layout. Backend has 9 passing tests (unit +
Postgres integration); CI runs them plus the Next.js build on every push.

Auth (Supabase middleware, session refresh, `/auth/callback`, `/trips` gate) and JWT
verification (asymmetric JWKS + legacy HS256) are implemented but need a real Supabase
project to exercise. Gemini generation falls back to a deterministic mock until
`GEMINI_API_KEY` is set.

**Next**: add real Supabase + Gemini keys → [SETUP.md](SETUP.md). Deploy → [DEPLOY.md](DEPLOY.md).
Later: Places enrichment in action, per-day map view.
