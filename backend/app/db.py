"""Async database engine and session factory.

Supports PostgreSQL (asyncpg) and SQLite (aiosqlite) for local development.
Pool size is configurable via settings.
"""

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

if settings.database_url.startswith("sqlite"):
    _connect_args = {}
else:
    _connect_args = {"pool_size": settings.db_pool_size, "max_overflow": settings.db_max_overflow}

engine = create_async_engine(settings.database_url, echo=False, **_connect_args)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async database session.

    Commits on success, rolls back on exception, always closes.
    Uses a new session per request for isolation.
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


async def check_db_connection() -> bool:
    """Verify database connectivity by executing a lightweight query.
    
    Returns True if healthy, False if degraded.
    Used by the /health endpoint for dependency status.
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning("Database health check failed", extra={"error": str(exc)})
        return False
