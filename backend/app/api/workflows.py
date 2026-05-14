"""CRUD endpoints for workflow definitions — directed graphs of agent/router/human/output nodes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas import WorkflowCreate, WorkflowResponse, WorkflowUpdate, DeleteResponse
from app.services import workflow_service

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=list[WorkflowResponse])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    """List all workflow definitions, newest first. No input required."""
    wfs = await workflow_service.list_workflows(db)
    return [WorkflowResponse.from_orm(w) for w in wfs]


@router.get("/{workflow_id}", response_model=WorkflowResponse,
    responses={404: {"description": "Workflow not found"}})
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single workflow definition by UUID."""
    wf = await workflow_service.get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return WorkflowResponse.from_orm(wf)


@router.post("", status_code=201, response_model=WorkflowResponse)
async def create_workflow(body: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    """Create a new workflow from nodes, edges, and trigger config.

    Nodes define the steps (agents, routers, human gates, outputs, notes).
    Edges define the connections with optional conditions for routing.
    Trigger defines how the workflow starts (manual, schedule, channel).
    """
    wf = await workflow_service.create_workflow(db, body.model_dump())
    return WorkflowResponse.from_orm(wf)


@router.patch("/{workflow_id}", response_model=WorkflowResponse,
    responses={404: {"description": "Workflow not found"}})
async def update_workflow(workflow_id: str, body: WorkflowUpdate, db: AsyncSession = Depends(get_db)):
    """Update a workflow. Used to save canvas changes (nodes/edges)."""
    wf = await workflow_service.update_workflow(db, workflow_id, body.model_dump(exclude_none=True))
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return WorkflowResponse.from_orm(wf)


@router.delete("/{workflow_id}", response_model=DeleteResponse,
    responses={404: {"description": "Workflow not found"}})
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a workflow definition by UUID."""
    deleted = await workflow_service.delete_workflow(db, workflow_id)
    if not deleted:
        raise HTTPException(404, "Workflow not found")
    return {"ok": True}
