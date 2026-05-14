"""WorkflowDef JSON to LangGraph CompiledGraph compiler.

Converts a declarative node/edge workflow definition into an executable
LangGraph StateGraph with conditional routing and agent execution nodes.
"""

from datetime import datetime, timezone
from langgraph.graph import StateGraph

from app.bus import publish
from app.runtime.state import WorkflowState


def compile_workflow(nodes: list[dict], edges: list[dict], entry_node: str) -> StateGraph:
    """Build a LangGraph StateGraph from a workflow definition.

    Args:
        nodes: List of node dicts with id, type, and config.
        edges: List of edge dicts with source, target, and condition.
        entry_node: The node id to start execution from.

    Returns:
        A compiled LangGraph StateGraph ready for invocation.
    """
    builder = StateGraph(WorkflowState)

    for node in nodes:
        nid = node["id"]
        if node["type"] == "agent":
            _make_agent_node(builder, nid)
        elif node["type"] == "router":
            _make_router_node(builder, nid)
        elif node["type"] == "human":
            _make_human_node(builder, nid)

    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        condition = edge.get("condition")
        fallback = edge.get("fallback", target)

        if condition:
            def make_router(cond=condition, tgt=target, fb=fallback):
                def router_decision(state: WorkflowState) -> str:
                    """Route to target if _next matches this edge's condition, else fallback."""
                    return tgt if state.get("_next") == cond else fb
                return router_decision
            builder.add_conditional_edges(source, make_router())
        else:
            builder.add_edge(source, target)

    builder.set_entry_point(entry_node)
    return builder.compile()


def _make_agent_node(builder: StateGraph, node_id: str):
    """Wrap agent_node for use as a LangGraph node with event publishing."""
    from app.runtime.nodes.agent_node import agent_node

    async def wrapper(state: WorkflowState) -> WorkflowState:
        run_id = state.get("run_id", "")
        state["_current_agent_id"] = node_id

        # Publish agent_start event
        await publish(f"run:events:{run_id}", {
            "run_id": run_id,
            "type": "agent_start",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent_id": node_id,
            "payload": {"model": state.get("_agent_configs", {}).get(node_id, {}).get("model", "")},
        })

        result = await agent_node(state)
        state.update(result)

        # Publish agent_end event
        usage = result.get("_usage", {})
        await publish(f"run:events:{run_id}", {
            "run_id": run_id,
            "type": "agent_end",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent_id": node_id,
            "payload": {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
                "cost": round(usage.get("cost", 0.0), 6),
            },
        })

        return state

    builder.add_node(node_id, wrapper)


def _make_router_node(builder: StateGraph, node_id: str):
    """Wrap router_node for use as a LangGraph node."""
    from app.runtime.nodes.router_node import router_node

    async def wrapper(state: WorkflowState) -> WorkflowState:
        result = router_node(state)
        state.update(result)
        return state

    builder.add_node(node_id, wrapper)


def _make_human_node(builder: StateGraph, node_id: str):
    """Wrap human_node for use as a LangGraph node.

    If the human request has been resolved, passes through with the response.
    If not yet resolved, sets _waiting_for_human flag and returns.
    The executor is expected to check this flag and retry until resolved.
    """
    from app.runtime.nodes.human_node import human_node, is_resolved, get_human_response

    async def wrapper(state: WorkflowState) -> WorkflowState:
        run_id = state.get("run_id", "")
        if is_resolved(run_id):
            response = get_human_response(run_id)
            state["_waiting_for_human"] = False
            state["messages"].append({
                "role": "human",
                "content": response or "Approved",
            })
            return state
        state["_current_agent_id"] = node_id
        result = await human_node(state)
        state.update(result)
        return state

    builder.add_node(node_id, wrapper)
