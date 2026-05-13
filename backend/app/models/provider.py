"""LLM provider ORM model — external AI API connections."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db import Base


class LLMProvider(Base):
    """An external LLM provider configuration (OpenAI, Gemini, Anthropic, Ollama, etc.).

    API keys are encrypted at rest using Fernet (see app.security).
    The models list is cached from the provider's API.
    """

    __tablename__ = "llm_providers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_type: Mapped[str] = mapped_column(String(50), nullable=False)
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    api_key: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    models: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
