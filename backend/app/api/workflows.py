"""CRUD endpoints for workflow definitions."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.docs import list_response_example, response_example
from app.schemas import WorkflowCreate, WorkflowResponse, WorkflowUpdate, DeleteResponse
from app.services import workflow_service

router = APIRouter(prefix="/workflows", tags=["workflows"])

_WF_EXAMPLE = {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Research & Report",
    "nodes": [{"id": "researcher", "type": "agent", "config": {"system_prompt": "...", "tools": ["web_search"]}}],
    "edges": [{"source": "researcher", "target": "writer", "condition": None}],
    "trigger": {"type": "manual", "config": {}},
    "created_at": "2026-05-13T12:00:00+00:00",
    "updated_at": "2026-05-13T12:00:00+00:00",
}


@router.get("", response_model=list[WorkflowResponse],
    responses=list_response_example([_WF_EXAMPLE]))
async def list_workflows(db: AsyncSession = Depends(get_db)):
    """List all workflow definitions, newest first. No input required."""
    wfs = await workflow_service.list_workflows(db)
    return [WorkflowResponse.from_orm(w) for w in wfs]


@router.get("/{workflow_id}", response_model=WorkflowResponse,
    responses={**response_example(_WF_EXAMPLE), **{404: {"description": "Workflow not found"}}})
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single workflow by UUID."""
    wf = await workflow_service.get_workflow(db, workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return WorkflowResponse.from_orm(wf)


@router.post("", status_code=201, response_model=WorkflowResponse,
    responses=response_example(_WF_EXAMPLE))
async def create_workflow(body: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    """Create a new workflow from nodes, edges, and trigger config."""
    wf = await workflow_service.create_workflow(db, body.model_dump())
    return WorkflowResponse.from_orm(wf)


@router.patch("/{workflow_id}", response_model=WorkflowResponse,
    responses={**response_example(_WF_EXAMPLE), **{404: {"description": "Workflow not found"}}})
async def update_workflow(workflow_id: str, body: WorkflowUpdate, db: AsyncSession = Depends(get_db)):
    """Update a workflow. Used to save canvas changes."""
    wf = await workflow_service.update_workflow(db, workflow_id, body.model_dump(exclude_none=True))
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return WorkflowResponse.from_orm(wf)


@router.delete("/{workflow_id}", response_model=DeleteResponse,
    responses={**response_example({"ok": True}), **{404: {"description": "Workflow not found"}}})
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a workflow by UUID."""
    deleted = await workflow_service.delete_workflow(db, workflow_id)
    if not deleted:
        raise HTTPException(404, "Workflow not found")
    return {"ok": True}
