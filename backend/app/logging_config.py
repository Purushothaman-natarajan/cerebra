"""Structured logging configuration for production observability.

Provides a consistent logging setup with JSON-formatted output,
request-id propagation, and level-based filtering.
"""

import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone

from app.config import settings

# Context variable for request-id propagation across async boundaries
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


class StructuredFormatter(logging.Formatter):
    """Produces structured log records as JSON lines for log aggregators.

    Includes: timestamp, level, logger, message, request_id, correlation_id,
    service name, and any extra fields passed via the `extra` dict.
    """

    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()
        base = {
            "timestamp": ts,
            "level": record.levelname,
            "logger": record.name,
            "service": settings.service_name,
            "request_id": get_request_id(),
            "correlation_id": get_correlation_id(),
        }
        # Include extra fields from the logging call
        for key, value in getattr(record, "extra", {}).items():
            if key not in base:
                base[key] = value

        msg = record.getMessage()
        if record.exc_info and record.exc_info[0]:
            import traceback
            base["exception"] = "".join(traceback.format_exception(*record.exc_info))

        import json
        return json.dumps({**base, "message": msg})


def configure_logging() -> None:
    """Initialize the root logger with structured JSON output."""
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())

    root = logging.getLogger()
    root.setLevel(level)
    # Remove default handlers to avoid duplicate output
    for h in root.handlers[:]:
        root.removeHandler(h)
    root.addHandler(handler)

    # Quiet noisy third-party loggers
    for name in ("httpx", "httpcore", "urllib3", "asyncio"):
        logging.getLogger(name).setLevel(logging.WARNING)

    logging.getLogger(__name__).info("Logging configured", extra={"log_level": settings.log_level})


def get_logger(name: str) -> logging.Logger:
    """Return a logger with the given name, pre-configured for structured output."""
    return logging.getLogger(name)
