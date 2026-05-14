"""AgentTemplate ORM model — pre-built agent presets users can select and customize."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db import Base


class AgentTemplate(Base):
    __tablename__ = "agent_templates"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False, default="gemini-2.0-flash")
    tools: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    max_iterations: Mapped[int] = mapped_column(Integer, default=10)
    guardrails: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
