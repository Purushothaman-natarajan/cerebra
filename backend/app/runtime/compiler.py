from langgraph.graph import END, StateGraph

from app.runtime.state import WorkflowState


def compile_workflow(
    nodes: list[dict],
    edges: list[dict],
    entry_node: str,
) -> StateGraph:
    builder = StateGraph(WorkflowState)

    for node in nodes:
        nid = node["id"]
        if node["type"] == "agent":
            _make_agent_node(builder, nid)
        elif node["type"] == "router":
            _make_router_node(builder, nid)

    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        condition = edge.get("condition")
        fallback = edge.get("fallback", target)

        if condition:
            def make_router(cond=condition, tgt=target, fb=fallback):
                def router_decision(state: WorkflowState) -> str:
                    return tgt if state.get("_next") == cond else fb
                return router_decision

            builder.add_conditional_edges(source, make_router())
        else:
            builder.add_edge(source, target)

    builder.set_entry_point(entry_node)

    graph = builder.compile()
    return graph


def _make_agent_node(builder: StateGraph, node_id: str):
    from app.runtime.nodes.agent_node import agent_node

    async def wrapper(state: WorkflowState) -> WorkflowState:
        state["_current_agent_id"] = node_id
        result = await agent_node(state)
        state.update(result)
        return state

    builder.add_node(node_id, wrapper)


def _make_router_node(builder: StateGraph, node_id: str):
    from app.runtime.nodes.router_node import router_node

    async def wrapper(state: WorkflowState) -> WorkflowState:
        result = router_node(state)
        state.update(result)
        return state

    builder.add_node(node_id, wrapper)
