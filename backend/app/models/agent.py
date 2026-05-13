"""Agent ORM model — an LLM-powered worker with tools and guardrails."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False, default="gemini-2.0-flash")
    tools: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    channel_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    max_iterations: Mapped[int] = mapped_column(Integer, default=10)
    guardrails: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
