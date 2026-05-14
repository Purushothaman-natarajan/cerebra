"""Human-in-the-loop node — pauses workflow for human approval.

When a human node is reached, the workflow publishes a human_request event
and stores the pending state. An API endpoint allows the user to approve
or reject, which continues or modifies the workflow.
"""

from datetime import datetime, timezone

from app.bus import publish

# In-memory store: run_id -> { node_id, payload, resolved: bool }
_pending_human_approvals: dict[str, dict] = {}


async def human_node(state: dict) -> dict:
    """Execute a human-in-the-loop node.

    Publishes a human_request event, stores pending approval info in memory,
    and polls for resolution. Once resolved (approved or rejected), continues.
    """
    run_id = state.get("run_id", "unknown")
    agent_id = state.get("_current_agent_id", "human")
    cfg = state.get("_agent_configs", {}).get(agent_id, {})
    message = cfg.get("message", "Human approval required")
    expected_input = cfg.get("expected_input", "")

    # Publish human_request event
    payload = {"message": message, "expected_input": expected_input}
    event = {
        "run_id": run_id, "type": "human_request",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": payload, "agent_id": agent_id,
    }
    await publish(f"run:events:{run_id}", event)

    # Store pending approval
    _pending_human_approvals[run_id] = {
        "node_id": agent_id,
        "message": message,
        "expected_input": expected_input,
        "resolved": False,
        "approved": None,
        "response": None,
    }

    # Poll until resolved (called externally via API)
    # The executor will retry this node until approved/rejected
    # For now, just return with a flag
    return {
        "_waiting_for_human": True,
        "_human_message": message,
    }


def resolve_human(run_id: str, approved: bool, response: str = "") -> bool:
    """Resolve a pending human approval. Called from the API."""
    pending = _pending_human_approvals.get(run_id)
    if not pending or pending.get("resolved"):
        return False
    pending["resolved"] = True
    pending["approved"] = approved
    pending["response"] = response
    return True


def get_pending_human(run_id: str) -> dict | None:
    """Get pending human approval state for a run."""
    return _pending_human_approvals.get(run_id)


def is_resolved(run_id: str) -> bool:
    """Check if a pending human request has been resolved."""
    pending = _pending_human_approvals.get(run_id)
    if not pending:
        return True  # no pending request
    return pending.get("resolved", False)


def get_human_response(run_id: str) -> str | None:
    """Get the human's response for a resolved request."""
    pending = _pending_human_approvals.get(run_id)
    if pending and pending.get("resolved"):
        return pending.get("response", "")
    return None
