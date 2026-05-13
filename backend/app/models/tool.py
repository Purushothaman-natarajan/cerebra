"""Custom tool ORM model — user-defined extensions for agents."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db import Base


class CustomTool(Base):
    """A user-defined tool that extends agent capabilities beyond built-ins.

    Supports HTTP calls, Python code execution, and webhook integrations.
    Built-in tools (web_search, calculator, etc.) are registered via decorators,
    custom tools are stored in this table.
    """

    __tablename__ = "custom_tools"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    tool_type: Mapped[str] = mapped_column(String(50), nullable=False, default="http")
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_builtin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
