"""Integration-test fixtures.

Requires a reachable Postgres. Set TEST_DATABASE_URL, or these tests are skipped.
Locally: `createdb travel_planner_test` and
`export TEST_DATABASE_URL=postgresql+asyncpg://<user>@localhost:5432/travel_planner_test`
"""

import os

import pytest
import pytest_asyncio

# Force the offline/mock path — tests must never call the real Gemini/Places APIs,
# even if the developer's .env has live keys. Set before app.config is imported.
os.environ["GEMINI_API_KEY"] = ""
os.environ["GOOGLE_PLACES_API_KEY"] = ""
os.environ["FX_RATES_ENABLED"] = "0"
os.environ["PHOTOS_ENABLED"] = "0"
os.environ["ENVIRONMENT"] = "development"

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL, reason="TEST_DATABASE_URL not set"
)


@pytest_asyncio.fixture
async def client():
    if not TEST_DATABASE_URL:
        pytest.skip("TEST_DATABASE_URL not set")

    from httpx import ASGITransport, AsyncClient
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.db import Base, get_db
    from app.main import app
    from app.models import db_models  # noqa: F401

    engine = create_async_engine(TEST_DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def _get_db():
        async with Session() as session:
            yield session

    app.dependency_overrides[get_db] = _get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.fixture
def auth_headers():
    return {"X-Dev-User": "11111111-1111-1111-1111-111111111111"}
