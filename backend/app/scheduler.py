"""APScheduler integration — runs scheduled workflows at cron intervals with concurrency guards.

Started in the FastAPI lifespan, checks the DB every 60s for workflows with
trigger.type == "schedule" and executes them via run_workflow.
Concurrent runs of the same workflow are prevented to avoid overlap.
"""

import asyncio
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import engine
from app.logging_config import get_logger
from app.models.workflow import WorkflowDef
from app.runtime.executor import run_workflow

logger = get_logger(__name__)

scheduler = AsyncIOScheduler()

# Track workflow IDs currently executing to prevent overlapping runs
_running_workflows: set[str] = set()
_EXECUTION_TIMEOUT = 300  # 5 minutes max per scheduled run


async def _run_scheduled_workflows():
    """Check for due scheduled workflows and execute them with concurrency guards."""
    try:
        async with AsyncSession(engine) as db:
            result = await db.execute(
                select(WorkflowDef).where(WorkflowDef.trigger["type"].as_string() == "schedule")
            )
            workflows = result.scalars().all()

        for wf in workflows:
            wf_id = str(wf.id)

            # Skip if this workflow is already running
            if wf_id in _running_workflows:
                logger.debug("Skipping scheduled workflow '%s' — already running", wf.name)
                continue

            config = wf.trigger.get("config", {})
            input_message = config.get("input", f"Scheduled run: {wf.name}")

            # Validate workflow structure before attempting to run
            if not wf.nodes:
                logger.warning("Skipping scheduled workflow '%s' — no nodes defined", wf.name)
                continue

            entry_node = wf.trigger.get("entry_node", wf.nodes[0].get("id", ""))
            if not entry_node:
                logger.warning("Skipping scheduled workflow '%s' — no entry point", wf.name)
                continue

            wf_def = {"nodes": wf.nodes, "edges": wf.edges, "entry_node": entry_node}
            _running_workflows.add(wf_id)

            try:
                async with AsyncSession(engine) as run_db:
                    rid = await asyncio.wait_for(
                        run_workflow(wf_def, input_message, db=run_db),
                        timeout=_EXECUTION_TIMEOUT,
                    )
                logger.info("Scheduled workflow executed", extra={
                    "workflow": wf.name, "workflow_id": wf_id, "run_id": rid,
                })
            except asyncio.TimeoutError:
                logger.error("Scheduled workflow timed out after %ss", _EXECUTION_TIMEOUT, extra={
                    "workflow": wf.name, "workflow_id": wf_id,
                })
            except Exception as e:
                logger.error("Scheduled workflow failed", extra={
                    "workflow": wf.name, "workflow_id": wf_id, "error": str(e),
                })
            finally:
                _running_workflows.discard(wf_id)

    except Exception as e:
        logger.warning("Scheduled workflow check failed", extra={"error": str(e)})


def start_scheduler():
    """Start the APScheduler with a 60-second interval check."""
    if scheduler.running:
        return
    scheduler.add_job(
        _run_scheduled_workflows,
        trigger="interval",
        seconds=60,
        id="check_scheduled_workflows",
        replace_existing=True,
        misfire_grace_time=30,
    )
    scheduler.start()
    logger.info("Workflow scheduler started", extra={"interval_seconds": 60})


def stop_scheduler():
    """Shut down the APScheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        _running_workflows.clear()
        logger.info("Workflow scheduler stopped")
