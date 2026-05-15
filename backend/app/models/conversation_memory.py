"""Conversation memory model — persists agent conversation history across restarts."""

from datetime import datetime, timezone

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db import Base


class ConversationMemory(Base):
    """Persistent conversation memory for agents with memory_enabled.

    Each row stores a rolling window of the last N message exchanges
    for a given agent. Updated on each agent execution.
    """

    __tablename__ = "conversation_memory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agent_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True, unique=True)
    messages: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
