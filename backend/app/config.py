from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # Base project URL, e.g. https://abcdxyz.supabase.co  (Project Settings -> API)
    supabase_url: str | None = None
    # Legacy HS256 shared secret (Project Settings -> API -> JWT Settings -> JWT Secret).
    # Only needed if the project still issues HS256 tokens; new projects use JWKS.
    supabase_jwt_secret: str | None = None
    supabase_jwt_audience: str = "authenticated"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    google_places_api_key: str | None = None

    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def supabase_jwks_url(self) -> str | None:
        if not self.supabase_url:
            return None
        return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
