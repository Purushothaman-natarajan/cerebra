"""Persistent conversation memory — stores and retrieves message history for agents.

Uses the database (conversation_memory table) with an in-memory cache fallback
when no DB session is available. Keeps a rolling window of the last N exchanges.
"""

import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

_MAX_HISTORY = 10

# In-memory fallback store (used when no DB session available)
_fallback_store: dict[str, list[dict]] = defaultdict(list)

logger = logging.getLogger(__name__)


async def get_history(agent_id: str, db: AsyncSession | None = None) -> list[dict]:
    """Get conversation history for an agent.

    Tries DB first, falls back to in-memory cache.
    """
    if db is not None:
        try:
            from app.models.conversation_memory import ConversationMemory
            result = await db.execute(
                select(ConversationMemory).where(ConversationMemory.agent_id == agent_id)
            )
            record = result.scalar_one_or_none()
            if record and record.messages:
                return list(record.messages)
        except Exception as exc:
            logger.warning("Failed to read conversation memory from DB: %s", exc)

    return list(_fallback_store.get(agent_id, []))


async def add_messages(agent_id: str, messages: list[dict], db: AsyncSession | None = None):
    """Append new messages to an agent's conversation history.

    Persists to DB when available, falls back to in-memory cache.
    """
    if db is not None:
        try:
            from app.models.conversation_memory import ConversationMemory
            result = await db.execute(
                select(ConversationMemory).where(ConversationMemory.agent_id == agent_id)
            )
            record = result.scalar_one_or_none()
            if not record:
                record = ConversationMemory(agent_id=agent_id, messages=list(messages))
                db.add(record)
            else:
                store = list(record.messages or [])
                store.extend(messages)
                if len(store) > _MAX_HISTORY * 2:
                    store = store[-_MAX_HISTORY * 2:]
                record.messages = store
                record.updated_at = datetime.now(timezone.utc)
            await db.flush()
            return
        except Exception as exc:
            logger.warning("Failed to persist conversation memory to DB: %s", exc)

    # Fallback: in-memory
    store = _fallback_store[agent_id]
    store.extend(messages)
    if len(store) > _MAX_HISTORY * 2:
        _fallback_store[agent_id] = store[-_MAX_HISTORY * 2:]


async def clear_history(agent_id: str, db: AsyncSession | None = None):
    """Clear conversation history for an agent."""
    _fallback_store.pop(agent_id, None)
    if db is not None:
        try:
            from app.models.conversation_memory import ConversationMemory
            result = await db.execute(
                select(ConversationMemory).where(ConversationMemory.agent_id == agent_id)
            )
            record = result.scalar_one_or_none()
            if record:
                await db.delete(record)
                await db.flush()
        except Exception as exc:
            logger.warning("Failed to clear conversation memory from DB: %s", exc)
