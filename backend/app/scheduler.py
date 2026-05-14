"""APScheduler integration — runs scheduled workflows at cron intervals.

Started in the FastAPI lifespan, checks the DB every 60s for workflows with
trigger.type == "schedule" and executes them via run_workflow.
"""

import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import engine
from app.models.workflow import WorkflowDef
from app.runtime.executor import run_workflow

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def _run_scheduled_workflows():
    """Check for due scheduled workflows and execute them."""
    try:
        async with AsyncSession(engine) as db:
            result = await db.execute(
                select(WorkflowDef).where(WorkflowDef.trigger["type"].as_string() == "schedule")
            )
            workflows = result.scalars().all()

        for wf in workflows:
            config = wf.trigger.get("config", {})
            input_message = config.get("input", f"Scheduled run: {wf.name}")
            wf_def = {
                "nodes": wf.nodes,
                "edges": wf.edges,
                "entry_node": wf.nodes[0]["id"] if wf.nodes else "",
            }
            try:
                rid = await run_workflow(wf_def, input_message, db=None)
                logger.info("Scheduled workflow '%s' started — run_id=%s", wf.name, rid)
            except Exception as e:
                logger.error("Scheduled workflow '%s' failed: %s", wf.name, e)
    except Exception as e:
        logger.warning("Scheduled workflow check failed: %s", e)


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
    logger.info("Workflow scheduler started (interval=60s)")


def stop_scheduler():
    """Shut down the APScheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Workflow scheduler stopped")
