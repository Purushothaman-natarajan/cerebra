"""Alembic environment configuration — auto-detects sync DB URL from settings.

Falls back to SQLite for local development when asyncpg driver is configured
(since Alembic requires a sync driver).
"""

from logging.config import fileConfig
import re

from alembic import context
from sqlalchemy import engine_from_config, pool, create_engine

from app.models import Agent, WorkflowDef, Run, RunEvent, Log, Channel, ChannelMessage, LLMProvider, CustomTool, AgentTemplate  # noqa: F401

# Import metadata without triggering async engine creation
from app.db import Base

target_metadata = Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _get_sync_url() -> str:
    """Convert the async DATABASE_URL to a sync-compatible URL for Alembic.

    - postgresql+asyncpg:// → postgresql://
    - sqlite+aiosqlite:// → sqlite+pysqlite://
    Falls back to settings.database_url, then to hardcoded default.
    """
    try:
        from app.config import settings
        url = settings.database_url
    except Exception:
        url = config.get_main_option("sqlalchemy.url", "")

    if not url:
        url = "sqlite+pysqlite:///./cerebra.db"

    # Alembic needs a sync driver
    url = re.sub(r"\+(asyncpg|aiosqlite)", "+pysqlite", url)
    url = url.replace("+pysqlite://", "://") if "sqlite" in url else url
    url = re.sub(r"\+asyncpg", "", url)  # postgresql+asyncpg → postgresql
    return url


def run_migrations_offline():
    """Generate SQL migration script without connecting to a database."""
    url = _get_sync_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations using the sync-equivalent of the configured DATABASE_URL."""
    url = _get_sync_url()
    connectable = engine_from_config(
        {"sqlalchemy.url": url},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
