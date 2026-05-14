"""Workflow executor — runs a compiled LangGraph graph with event streaming.

Events are published to Redis (per-run channel) and optionally persisted to DB.
Token usage and cost are extracted from the final state and persisted.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.bus import publish
from app.runtime.compiler import compile_workflow
from app.runtime.state import WorkflowState
from app.services import run_service


async def run_workflow(
    workflow_def: dict,
    input_message: str,
    run_id: str | None = None,
    db: AsyncSession | None = None,
) -> str:
    """Execute a workflow definition with the given input message.

    Args:
        workflow_def: Dict with nodes, edges, entry_node keys.
        input_message: The user message to start the workflow with.
        run_id: Optional run ID (generated if not provided).
        db: Optional DB session for persisting events.

    Returns:
        The run ID.
    """
    rid = run_id or str(uuid.uuid4())
    nodes = workflow_def.get("nodes", [])
    edges = workflow_def.get("edges", [])
    entry_node = workflow_def.get("entry_node", nodes[0]["id"] if nodes else "")

    agent_configs = {}
    for node in nodes:
        if node["type"] == "agent":
            agent_configs[node["id"]] = node.get("config", {})

    graph = compile_workflow(nodes, edges, entry_node)

    initial_state: WorkflowState = {
        "messages": [{"role": "user", "content": input_message}],
        "_next": "",
        "_current_agent_id": None,
        "_agent_configs": agent_configs,
        "_router_conditions": {},
        "run_id": rid,
        "_usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost": 0.0},
        "_db": db,
    }

    event = {"run_id": rid, "type": "run_start", "timestamp": datetime.now(timezone.utc).isoformat(), "payload": {"input": input_message}}
    await publish(f"run:events:{rid}", event)
    if db:
        await run_service.add_run_event(db, rid, "run_start", "system", {"input": input_message})

    try:
        result = await graph.ainvoke(initial_state)
    except Exception:
        event = {"run_id": rid, "type": "run_error", "timestamp": datetime.now(timezone.utc).isoformat(), "payload": {"error": "Workflow execution failed"}}
        await publish(f"run:events:{rid}", event)
        if db:
            await run_service.add_run_event(db, rid, "run_error", "system", event["payload"])
        raise

    usage = result.get("_usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)
    total_tokens = usage.get("total_tokens", 0)
    cost = usage.get("cost", 0.0)

    messages = result.get("messages", [])
    final_output = ""
    for message in reversed(messages):
        if message.get("role") == "assistant":
            final_output = str(message.get("content", ""))
            break
    if not final_output and messages:
        final_output = str(messages[-1].get("content", messages[-1]))

    event = {
        "run_id": rid, "type": "run_end",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "output": final_output,
            "messages": messages,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "cost": round(cost, 6),
        },
    }
    await publish(f"run:events:{rid}", event)
    if db:
        await run_service.add_run_event(db, rid, "run_end", "system", event["payload"])
        await run_service.update_run_tokens(db, rid, prompt_tokens, completion_tokens, total_tokens, cost)

    return rid
