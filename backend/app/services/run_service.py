"""Run and RunEvent business logic."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.run import Run, RunEvent


async def list_runs(db: AsyncSession) -> list[Run]:
    result = await db.execute(select(Run).order_by(Run.started_at.desc().nulls_first()))
    return list(result.scalars().all())


async def get_run(db: AsyncSession, run_id: str) -> Run | None:
    result = await db.execute(select(Run).where(Run.id == uuid.UUID(run_id)))
    return result.scalar_one_or_none()


async def create_run(db: AsyncSession, workflow_id: str) -> Run:
    run = Run(workflow_id=uuid.UUID(workflow_id), status="pending")
    db.add(run)
    await db.flush()
    return run


async def update_run_status(db: AsyncSession, run_id: str, status: str) -> Run | None:
    run = await get_run(db, run_id)
    if not run:
        return None
    run.status = status
    if status == "running":
        run.started_at = datetime.now(timezone.utc)
    elif status in ("completed", "failed"):
        run.finished_at = datetime.now(timezone.utc)
    await db.flush()
    return run


async def get_run_events(db: AsyncSession, run_id: str) -> list[RunEvent]:
    result = await db.execute(
        select(RunEvent).where(RunEvent.run_id == uuid.UUID(run_id)).order_by(RunEvent.timestamp)
    )
    return list(result.scalars().all())


async def clear_runs(db: AsyncSession) -> int:
    result = await db.execute(delete(RunEvent))
    await db.execute(delete(Run))
    await db.flush()
    return result.rowcount or 0


async def add_run_event(db: AsyncSession, run_id: str, event_type: str, agent_id: str, payload: dict) -> RunEvent:
    event = RunEvent(run_id=uuid.UUID(run_id), type=event_type, agent_id=agent_id, payload=payload)
    db.add(event)
    await db.flush()
    return event


async def update_run_tokens(
    db: AsyncSession, run_id: str,
    prompt_tokens: int, completion_tokens: int, total_tokens: int, cost: float,
) -> Run | None:
    run = await get_run(db, run_id)
    if not run:
        return None
    run.prompt_tokens = prompt_tokens
    run.completion_tokens = completion_tokens
    run.total_tokens = total_tokens
    run.cost = cost
    await db.flush()
    return run
