"""Ingest frontend logs and publish them to the event bus for live streaming.

This endpoint accepts structured log objects from the frontend and does two things:
- Writes them to the backend logger (so they appear in server logs)
- Publishes them to the event bus on channel `logs:global` and, when `run_id` is set,
  to `logs:run:{run_id}` so connected WebSocket clients can receive them.

The schema is intentionally permissive so UI can send flexible payloads. Use
the existing ExField/_example helpers in app.schemas for good Swagger UI examples.
"""

import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.services import log_service
from datetime import datetime

from app.schemas import ExField
from pydantic import BaseModel, ConfigDict, Field
from typing import Any

from app.bus import publish

router = APIRouter(prefix="/logs", tags=["logs"])

logger = logging.getLogger("frontend-logs")


class LogEntry(BaseModel):
    model_config = ConfigDict(json_schema_extra={"example": {
        "timestamp": "2026-05-14T12:00:00+00:00",
        "level": "info",
        "source": "frontend",
        "component": "ToolTestDialog",
        "action": "tool_test",
        "message": "Tool test started",
        "run_id": "550e8400-e29b-41d4-a716-446655440002",
        "details": {"tool": "web_search", "input": "Cerebra"}
    }})

    timestamp: str = Field(..., description="ISO-8601 timestamp", examples=["2026-05-14T12:00:00+00:00"], json_schema_extra={"example": "2026-05-14T12:00:00+00:00"})
    level: str = Field(..., description="log level", examples=["info"], json_schema_extra={"example": "info"})
    source: str = Field(..., description="originating system", examples=["frontend"], json_schema_extra={"example": "frontend"})
    component: str | None = Field(default=None, description="UI component or module", examples=["ToolTestDialog"])
    action: str | None = Field(default=None, description="semantic action name", examples=["tool_test"])
    message: str | None = Field(default=None, description="human friendly message", examples=["Tool test started"])
    run_id: str | None = Field(default=None, description="Optional run UUID to correlate with a run", examples=["550e8400-e29b-41d4-a716-446655440002"])
    details: dict[str, Any] | None = Field(default=None, description="Opaque details object", examples=[{"tool": "web_search", "input": "Cerebra"}])


@router.post("", status_code=201)
async def ingest_log(entry: LogEntry, db: AsyncSession = Depends(get_db)):
    """Accept a frontend log entry, persist (best-effort), write it to server logs, and publish it to the event bus."""
    try:
        # Structured server log so it's searchable
        logger.info("%s | %s | %s | %s", entry.level, entry.component or entry.source, entry.action or "", entry.message or "", extra={"details": entry.details, "run_id": entry.run_id})
    except Exception:
        # Fallback to a safe string log if structured logging fails
        logger.info("%s %s %s %s %s", entry.timestamp, entry.level, entry.component, entry.action, entry.message)

    # Persist to DB (best-effort)
    try:
        await log_service.create_log(db,
                                     run_id=entry.run_id,
                                     timestamp=entry.timestamp,
                                     level=entry.level,
                                     source=entry.source,
                                     component=entry.component,
                                     action=entry.action,
                                     message=entry.message,
                                     details=entry.details)
        await db.commit()
    except Exception:
        # Do not fail on DB errors — logging must be best-effort
        try:
            await db.rollback()
        except Exception:
            pass

    # Publish to global logs channel and per-run channel if run_id provided.
    # Also publish to the run event stream so existing WebSocket clients receive it.
    payload = entry.model_dump()
    msg = {"type": "log", "timestamp": payload.get("timestamp"), "payload": payload}
    await publish("logs:global", msg)
    if entry.run_id:
        await publish(f"logs:run:{entry.run_id}", msg)
        await publish(f"run:events:{entry.run_id}", msg)

    return {"ok": True}


@router.get("", status_code=200)
async def list_logs(run_id: str | None = Query(None), start_ts: str | None = Query(None), end_ts: str | None = Query(None), limit: int = Query(200), db: AsyncSession = Depends(get_db)):
    """Query persisted logs by run_id and optional start/end ISO timestamps."""
    start = None
    end = None
    try:
        if start_ts:
            start = datetime.fromisoformat(start_ts)
        if end_ts:
            end = datetime.fromisoformat(end_ts)
    except Exception:
        raise HTTPException(400, "start_ts and end_ts must be ISO-8601 datetimes")

    logs = await log_service.query_logs(db, run_id=run_id, start=start, end=end, limit=min(limit, 1000))
    out = []
    for l in logs:
        out.append({
            "id": l.id,
            "run_id": str(l.run_id) if l.run_id else None,
            "timestamp": l.timestamp.isoformat(),
            "level": l.level,
            "source": l.source,
            "component": l.component,
            "action": l.action,
            "message": l.message,
            "details": l.details,
        })
    return out
