"""Run management — trigger workflow execution, query status and event history."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.runtime.executor import run_workflow
from app.schemas import RunCreate, RunEventResponse, RunResponse, DeleteResponse
from app.services import run_service, workflow_service

router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("", response_model=list[RunResponse])
async def list_runs(db: AsyncSession = Depends(get_db)):
    """List all runs, newest first. No input required."""
    runs = await run_service.list_runs(db)
    return [RunResponse.from_orm(r) for r in runs]


@router.get("/{run_id}", response_model=RunResponse,
    responses={404: {"description": "Run not found"}})
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single run's status by UUID."""
    run = await run_service.get_run(db, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return RunResponse.from_orm(run)


@router.get("/{run_id}/events", response_model=list[RunEventResponse],
    responses={404: {"description": "Run not found"}})
async def get_run_events(run_id: str, db: AsyncSession = Depends(get_db)):
    """Get all events for a run (agent_start, tool_call, message, agent_end, error)."""
    events = await run_service.get_run_events(db, run_id)
    return [RunEventResponse.from_orm(e) for e in events]


@router.post("", status_code=201, response_model=RunResponse,
    responses={404: {"description": "Workflow not found"}, 500: {"description": "Execution failed"}})
async def trigger_run(body: RunCreate, db: AsyncSession = Depends(get_db)):
    """Trigger execution of a workflow.

    Creates a Run record, compiles the workflow to a LangGraph graph,
    executes it, and streams events via Redis pub/sub to WebSocket clients.
    Sets status to 'completed' or 'failed' when done.

    Requires the referenced workflow to exist and at least one LLM provider configured.
    """
    wf = await workflow_service.get_workflow(db, body.workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")

    run = await run_service.create_run(db, body.workflow_id)
    await run_service.update_run_status(db, str(run.id), "running")

    wf_def = {"nodes": wf.nodes, "edges": wf.edges, "entry_node": wf.nodes[0]["id"] if wf.nodes else ""}
    try:
        await run_workflow(wf_def, body.input, str(run.id), db)
        await run_service.update_run_status(db, str(run.id), "completed")
    except Exception:
        await run_service.update_run_status(db, str(run.id), "failed")
        raise

    run = await run_service.get_run(db, str(run.id))
    return RunResponse.from_orm(run)
