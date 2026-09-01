from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# statement_cache_size=0 keeps asyncpg working through PgBouncer-style poolers
# (e.g. Supabase's transaction pooler on port 6543), and is harmless on a direct
# connection. NullPool-style behaviour is left to the pooler; SQLAlchemy keeps a
# small pool for direct connections.
_connect_args = {"statement_cache_size": 0}

engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args=_connect_args,
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
