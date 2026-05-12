from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.runtime.executor import run_workflow
from app.schemas import RunCreate, RunEventResponse, RunResponse
from app.services import run_service, workflow_service

router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("")
async def list_runs(db: AsyncSession = Depends(get_db)):
    runs = await run_service.list_runs(db)
    return [RunResponse.from_orm(r) for r in runs]


@router.get("/{run_id}")
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    run = await run_service.get_run(db, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return RunResponse.from_orm(run)


@router.get("/{run_id}/events")
async def get_run_events(run_id: str, db: AsyncSession = Depends(get_db)):
    events = await run_service.get_run_events(db, run_id)
    return [RunEventResponse.from_orm(e) for e in events]


@router.post("", status_code=201)
async def trigger_run(body: RunCreate, db: AsyncSession = Depends(get_db)):
    wf = await workflow_service.get_workflow(db, body.workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")

    run = await run_service.create_run(db, body.workflow_id)
    await run_service.update_run_status(db, str(run.id), "running")

    wf_def = {"nodes": wf.nodes, "edges": wf.edges, "entry_node": wf.nodes[0]["id"] if wf.nodes else ""}
    await run_workflow(wf_def, body.input, str(run.id), db)

    await run_service.update_run_status(db, str(run.id), "completed")
    run = await run_service.get_run(db, str(run.id))
    return RunResponse.from_orm(run)
