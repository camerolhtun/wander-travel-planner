# Backend — AI Travel Planner API

FastAPI + SQLAlchemy 2.0 (async) + Alembic. Owns all business logic, DB access, and
external API calls (Gemini, Google Places).

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
```

Start a database (either one):

```bash
# local
docker compose up -d db          # from the repo root

# or point DATABASE_URL at your Supabase Postgres (postgresql+asyncpg://...)
```

Run migrations and the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs.

## Auth

Every `/trips`, `/days`, `/items` route needs `Authorization: Bearer <supabase-jwt>`.
For local testing without Supabase, set `ENVIRONMENT=development` and send
`X-Dev-User: <any-uuid>` instead — requests run as that user id.

```bash
curl -s localhost:8000/trips -H 'X-Dev-User: 00000000-0000-0000-0000-000000000001'
```

## Generating an itinerary

`POST /trips/{id}/generate` calls Gemini with a structured JSON schema, optionally
enriches each item via Google Places, and stores days + items. With no `GEMINI_API_KEY`
it returns a deterministic mock so the flow works before any keys exist. Regeneration
keeps days/items flagged `is_user_edited`.

## Tests / lint

```bash
ruff check .
pytest                     # unit tests only

# Integration tests (real Postgres): create a DB and point TEST_DATABASE_URL at it
createdb travel_planner_test
export TEST_DATABASE_URL=postgresql+asyncpg://$USER@localhost:5432/travel_planner_test
pytest                     # now runs API tests too
```

`tests/conftest.py` builds the schema from the models, overrides the `get_db`
dependency, and drives the app with an in-process ASGI client.

## Migrations

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Deploy (Railway)

The `Dockerfile` runs `alembic upgrade head` then `uvicorn` on `$PORT`. Set env vars:
`DATABASE_URL`, `SUPABASE_JWT_SECRET`, `GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY`,
`CORS_ORIGINS` (JSON array including your Vercel URL), `ENVIRONMENT=production`.
