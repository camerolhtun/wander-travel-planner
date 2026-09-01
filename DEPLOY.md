# Deploy

Frontend → **Vercel**, backend → **Railway**, database + auth → **Supabase**.
Do Supabase first (see [SETUP.md](SETUP.md)); you need its values for both services.

---

## Backend → Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** →
   pick this repo.
2. Settings → **Root Directory**: `backend` (Railway reads `backend/railway.json` and
   builds the `Dockerfile`).
3. **Variables**:

   | Key | Value |
   |---|---|
   | `ENVIRONMENT` | `production` |
   | `DATABASE_URL` | Supabase URI, `postgresql+asyncpg://…`, port 5432 |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_JWT_SECRET` | only if the project uses a legacy HS256 secret |
   | `GEMINI_API_KEY` | from Google AI Studio |
   | `GOOGLE_PLACES_API_KEY` | optional |
   | `CORS_ORIGINS` | `["https://<your-vercel-app>.vercel.app"]` (JSON array) |

4. Deploy. The container runs `alembic upgrade head` then `uvicorn` on `$PORT`.
   Healthcheck: `GET /health`.
5. Copy the public URL (e.g. `https://wander-api.up.railway.app`).

> `ENVIRONMENT=production` disables the `X-Dev-User` bypass — every request must carry a
> valid Supabase JWT.

---

## Frontend → Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import this repo.
2. **Root Directory**: `frontend` (framework auto-detected as Next.js).
3. **Environment Variables**:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
   | `NEXT_PUBLIC_API_URL` | the Railway URL from above |

   Do **not** set `NEXT_PUBLIC_DEV_USER_ID` in production.
4. Deploy, then copy the production URL.

---

## Wire the two together

1. Railway → `CORS_ORIGINS` → set to `["https://<your-vercel-app>.vercel.app"]` → redeploy.
2. Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://<your-vercel-app>.vercel.app`
   - **Redirect URLs**: add `https://<your-vercel-app>.vercel.app/**`
     (keep `http://localhost:3000/**` for local dev)
3. If using Google OAuth, add the Vercel callback in the Google Cloud OAuth client and in
   Supabase's Google provider.

---

## Smoke test

- Visit the Vercel URL → `/login` → magic link → lands on `/trips`.
- Create a trip → real Gemini itinerary renders.
- `GET https://<railway-url>/health` → `{"status":"ok"}`.

CI (`.github/workflows/ci.yml`) runs ruff + pytest (with a Postgres service) and the
Next.js build on every push and PR.
