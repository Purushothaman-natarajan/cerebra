"""Async database engine and session factory for PostgreSQL.

Uses SQLAlchemy 2.0 async API with asyncpg driver.
Engine pool size is configurable via settings.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

if settings.database_url.startswith("sqlite"):
    _url = settings.database_url
    _connect_args = {}
else:
    _url = settings.database_url
    _connect_args = {"pool_size": settings.db_pool_size, "max_overflow": settings.db_max_overflow}

engine = create_async_engine(_url, echo=False, **_connect_args)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async database session.

    Commits on success, rolls back on exception, always closes.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
