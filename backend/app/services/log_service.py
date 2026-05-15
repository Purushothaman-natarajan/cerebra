"""Service layer for persisted logs."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone

from app.models.log import Log


def _parse_timestamp(ts: str | None) -> datetime | None:
    """Parse an ISO-8601 timestamp string to a datetime object."""
    if not ts:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc)
    except (ValueError, AttributeError):
        return datetime.now(timezone.utc)


async def create_log(db: AsyncSession, *, run_id: str | None, timestamp: str | None, level: str | None,
                     source: str | None, component: str | None, action: str | None, message: str | None,
                     details: dict | None) -> Log:
    log = Log(
        run_id=run_id,
        timestamp=_parse_timestamp(timestamp),
        level=level or "info",
        source=source or "frontend",
        component=component,
        action=action,
        message=message,
        details=details or {},
    )
    db.add(log)
    await db.flush()
    return log


async def query_logs(db: AsyncSession, run_id: str | None = None, start: datetime | None = None,
                     end: datetime | None = None, limit: int = 200) -> List[Log]:
    q = select(Log).order_by(Log.timestamp.asc())
    if run_id:
        q = q.where(Log.run_id == run_id)
    if start:
        q = q.where(Log.timestamp >= start)
    if end:
        q = q.where(Log.timestamp <= end)
    result = await db.execute(q.limit(limit))
    return result.scalars().all()
