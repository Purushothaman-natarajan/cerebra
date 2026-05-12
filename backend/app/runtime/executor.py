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
    rid = run_id or str(uuid.uuid4())
    nodes = workflow_def.get("nodes", [])
    edges = workflow_def.get("edges", [])
    entry_node = workflow_def.get("entry_node", nodes[0]["id"] if nodes else "")

    agent_configs = {}
    for node in nodes:
        nid = node["id"]
        if node["type"] == "agent":
            agent_configs[nid] = node.get("config", {})

    graph = compile_workflow(nodes, edges, entry_node)

    initial_state: WorkflowState = {
        "messages": [{"role": "user", "content": input_message}],
        "_next": "",
        "_current_agent_id": None,
        "_agent_configs": agent_configs,
        "_router_conditions": {},
        "run_id": rid,
    }

    event = {
        "run_id": rid,
        "type": "run_start",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": {"input": input_message},
    }
    await publish("run:events", event)
    if db:
        await run_service.add_run_event(db, rid, "run_start", "system", {"input": input_message})

    result = await graph.ainvoke(initial_state)

    event = {
        "run_id": rid,
        "type": "run_end",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": {"messages": result.get("messages", [])},
    }
    await publish("run:events", event)
    if db:
        await run_service.add_run_event(db, rid, "run_end", "system", {"messages": str(result.get("messages", []))})

    return rid
