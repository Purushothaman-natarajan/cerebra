import os

import pytest

from app.runtime.compiler import compile_workflow


@pytest.mark.asyncio
async def test_two_agent_chain():
    nodes = [
        {
            "id": "agent1",
            "type": "agent",
            "config": {
                "system_prompt": "You are a helpful assistant.",
                "model": "gemini-2.0-flash",
                "tools": [],
                "max_iterations": 1,
            },
        },
        {
            "id": "agent2",
            "type": "agent",
            "config": {
                "system_prompt": "You are a concise summarizer.",
                "model": "gemini-2.0-flash",
                "tools": [],
                "max_iterations": 1,
            },
        },
    ]
    edges = [
        {"source": "agent1", "target": "agent2", "condition": None},
    ]

    graph = compile_workflow(nodes, edges, "agent1")

    state = {
        "messages": [{"role": "user", "content": "say hello world"}],
        "_next": "",
        "_current_agent_id": None,
        "_agent_configs": {"agent1": nodes[0]["config"], "agent2": nodes[1]["config"]},
        "_router_conditions": {},
        "run_id": "test-multi-1",
    }

    try:
        result = await graph.ainvoke(state)
        assert "messages" in result
        assert len(result["messages"]) >= 2
    except ValueError as e:
        if "API key" in str(e):
            pytest.skip("GEMINI_API_KEY not set")


def test_router_decision():
    from app.runtime.nodes.router_node import router_node

    state = {
        "messages": [{"role": "user", "content": "I have a billing question"}],
        "_router_conditions": {"billing": ["billing", "payment", "invoice"], "tech": ["error", "bug", "crash"]},
        "_next": "default",
    }
    result = router_node(state)
    assert result["_next"] == "billing"
