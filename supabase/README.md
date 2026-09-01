# Supabase setup

You need one Supabase project. It provides Postgres **and** auth.

## 1. Create the project

- https://supabase.com/dashboard → New project. Pick a region near you. Save the DB password.

## 2. Keys and where they go

| Value | Location in dashboard | Used by |
|-------|----------------------|---------|
| Project URL | Settings → API → Project URL | frontend `NEXT_PUBLIC_SUPABASE_URL` |
| anon public key | Settings → API → Project API keys → `anon` | frontend `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| JWT secret | Settings → API → JWT Settings → JWT Secret | backend `SUPABASE_JWT_SECRET` |
| Connection string | Settings → Database → Connection string → URI | backend `DATABASE_URL` |

For `DATABASE_URL`, use the connection pooler URI (port 6543) and change the scheme
from `postgresql://` to `postgresql+asyncpg://`. Remove `?pgbouncer=true` and instead
rely on `NullPool` (already configured for migrations).

## 3. Schema

Migrations are owned by Alembic, not the Supabase CLI:

```bash
cd ../backend
alembic upgrade head
```

## 4. Auth providers

Authentication → Providers:
- **Email**: enable, turn on "magic link".
- **Google**: create an OAuth client in Google Cloud Console, paste client id/secret,
  and add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect.

## 5. Row Level Security (defense in depth)

The API already scopes every query by `user_id`, but enable RLS too. Run
[`policies.sql`](policies.sql) in the SQL editor after migrations.
