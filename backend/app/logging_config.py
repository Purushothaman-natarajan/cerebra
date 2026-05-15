"""Logging configuration — human-readable console output.

Console output is formatted for easy reading during development.
Structured JSON logging can be enabled by setting LOG_FORMAT=json.
"""

import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone

from app.config import settings

_request_id: ContextVar[str] = ContextVar("request_id", default="")
_log_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")


def get_request_id() -> str:
    return _request_id.get()


def set_request_id(rid: str | None = None) -> str:
    rid = rid or uuid.uuid4().hex[:12]
    _request_id.set(rid)
    return rid


def get_correlation_id() -> str:
    return _log_correlation_id.get()


def set_correlation_id(cid: str | None = None) -> str:
    cid = cid or uuid.uuid4().hex[:12]
    _log_correlation_id.set(cid)
    return cid


class ConsoleFormatter(logging.Formatter):
    """Human-readable console format — clean, scannable, no empty fields."""

    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.fromtimestamp(record.created, tz=timezone.utc).strftime("%H:%M:%S")
        level = record.levelname.ljust(5)
        rid = get_request_id()
        rid_part = f" [{rid}]" if rid else ""
        msg = record.getMessage()

        # Format extra fields as key=value
        extra = getattr(record, "extra", {})
        details = ""
        if extra:
            parts = []
            for k, v in extra.items():
                if isinstance(v, (str, int, float, bool)):
                    parts.append(f"{k}={v}")
            if parts:
                details = "  (" + " ".join(parts[:4]) + ")"

        return f"{ts} [{level}]{rid_part} {record.name}: {msg}{details}"


def configure_logging() -> None:
    """Initialize the root logger with human-readable console output."""
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stdout)

    if settings.log_format == "json":
        from logging_config import JsonFormatter
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(ConsoleFormatter())

    root = logging.getLogger()
    root.setLevel(level)
    for h in root.handlers[:]:
        root.removeHandler(h)
    root.addHandler(handler)

    for name in ("httpx", "httpcore", "urllib3", "asyncio"):
        logging.getLogger(name).setLevel(logging.WARNING)
    # Suppress uvicorn's own access log (we have our own audit middleware)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)

    logging.getLogger(__name__).info("Logging configured", extra={"log_level": settings.log_level})


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
