# Wiring real Supabase + Gemini (local)

Do the steps below, then paste the six values into the two env files (or hand them to
whoever is doing the wiring). Everything is free-tier.

---

## 1. Supabase project

1. https://supabase.com/dashboard → **New project**. Region near you. Save the DB password.
2. Wait for it to finish provisioning (~2 min).

### Values to collect (Project Settings → API)

| Env var | Where | Goes in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" | `frontend/.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "Project API keys" → `anon` `public` | `frontend/.env.local` |
| `SUPABASE_URL` | same as Project URL | `backend/.env` |

### Database URL (Project Settings → Database → Connection string → **URI**)

- Pick **Session pooler** or the direct connection (port **5432**). Not the transaction
  pooler (6543).
- Copy the URI, then:
  - change `postgresql://` → `postgresql+asyncpg://`
  - keep the password inline; URL-encode any `@ : / #` in it
- That string is `DATABASE_URL` in `backend/.env`.

### JWT secret (Project Settings → API → **JWT Settings**)

- If you see **"JWT Signing Keys"** with an active ECC/ES256 key → the backend verifies
  via JWKS automatically from `SUPABASE_URL`. **Leave `SUPABASE_JWT_SECRET` blank.**
- If you only see a **"JWT Secret"** string (older projects) → copy it into
  `SUPABASE_JWT_SECRET` in `backend/.env`.
- (Both can be set; the backend picks per-token by algorithm.)

### Auth providers (Authentication → Providers)

- **Email**: enable, turn on "Confirm email" is optional; enable **magic link**.
- **Google** (optional now, needed for the Google button):
  - Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web).
  - Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
  - Paste client ID + secret into Supabase's Google provider.

### Redirect URLs (Authentication → URL Configuration)

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add `http://localhost:3000/**`

### Schema

From `backend/` with `DATABASE_URL` set in `.env`:

```bash
source .venv/bin/activate
alembic upgrade head
```

Then run [`supabase/policies.sql`](supabase/policies.sql) in the SQL editor (RLS defence
in depth).

---

## 2. Gemini API key

1. https://aistudio.google.com/apikey → **Create API key** (in a Google Cloud project).
2. That string is `GEMINI_API_KEY` in `backend/.env`.

Free tier is enough for development. `GEMINI_MODEL` defaults to `gemini-2.5-flash`.

---

## 3. Fill the env files

**`backend/.env`** (copy from `.env.example`):

```
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://postgres:<pw>@<host>:5432/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_JWT_SECRET=              # blank if using JWKS signing keys
GEMINI_API_KEY=<key>
CORS_ORIGINS=["http://localhost:3000"]
```

**`frontend/.env.local`**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_API_URL=http://localhost:8000
# delete NEXT_PUBLIC_DEV_USER_ID — real auth replaces the dev bypass
```

---

## 4. Restart and verify

```bash
# backend
cd backend && source .venv/bin/activate && alembic upgrade head && uvicorn app.main:app --reload

# frontend
cd frontend && npm run dev
```

- Go to http://localhost:3000/login → magic link → click it → lands on `/trips`.
- Create a trip → the itinerary should now be real Gemini output, not the
  "Set GEMINI_API_KEY…" placeholder text.
