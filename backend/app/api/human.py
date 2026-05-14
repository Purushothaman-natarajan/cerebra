"""Human-in-the-loop endpoints — approve/reject workflow pauses."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.runtime.nodes.human_node import (
    get_pending_human,
    is_resolved,
    resolve_human,
)

router = APIRouter(prefix="/runs", tags=["human"])


class HumanApprovalBody(BaseModel):
    approved: bool = Field(..., description="True to approve, false to reject.")
    response: str = Field(default="", description="Optional response message from the human.")


@router.get("/{run_id}/human-request", response_model=dict | None)
async def get_human_request(run_id: str):
    """Get the pending human approval request for a run (if any)."""
    pending = get_pending_human(run_id)
    if not pending:
        return None
    return {
        "run_id": run_id,
        "node_id": pending["node_id"],
        "message": pending["message"],
        "expected_input": pending["expected_input"],
        "resolved": pending["resolved"],
        "approved": pending["approved"],
    }


@router.post("/{run_id}/human-response", response_model=dict)
async def submit_human_response(run_id: str, body: HumanApprovalBody):
    """Submit a human response (approve/reject) for a pending workflow pause."""
    pending = get_pending_human(run_id)
    if not pending:
        raise HTTPException(404, "No pending human request found for this run")
    if pending.get("resolved"):
        raise HTTPException(400, "Human request already resolved")

    ok = resolve_human(run_id, body.approved, body.response)
    if not ok:
        raise HTTPException(500, "Failed to resolve human request")

    return {
        "ok": True,
        "run_id": run_id,
        "approved": body.approved,
        "response": body.response,
    }
