"""Log model for persisted frontend logs and server-side events."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db import Base


class Log(Base):
    __tablename__ = "logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc), index=True)
    level: Mapped[str] = mapped_column(String(20), nullable=False, default="info")
    source: Mapped[str] = mapped_column(String(100), nullable=False, default="frontend")
    component: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)
