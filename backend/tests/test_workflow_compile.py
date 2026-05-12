import os

import pytest

from app.runtime.compiler import compile_workflow


def test_compile_linear_workflow():
    nodes = [
        {"id": "agent1", "type": "agent", "agent_id": "a1", "config": {}},
        {"id": "agent2", "type": "agent", "agent_id": "a2", "config": {}},
    ]
    edges = [
        {"source": "agent1", "target": "agent2", "condition": None},
    ]

    graph = compile_workflow(nodes, edges, "agent1")
    assert graph is not None


def test_compile_conditional_workflow():
    nodes = [
        {"id": "router1", "type": "router", "config": {"conditions": {"billing": ["billing"]}}},
        {"id": "agent1", "type": "agent", "agent_id": "a1", "config": {}},
        {"id": "agent2", "type": "agent", "agent_id": "a2", "config": {}},
    ]
    edges = [
        {"source": "agent1", "target": "router1", "condition": None},
        {"source": "router1", "target": "agent2", "condition": "billing"},
    ]

    graph = compile_workflow(nodes, edges, "agent1")
    assert graph is not None


def test_compile_loop_workflow():
    nodes = [
        {"id": "agent1", "type": "agent", "agent_id": "a1", "config": {}},
    ]
    edges = [
        {"source": "agent1", "target": "agent1", "condition": "retry"},
    ]

    graph = compile_workflow(nodes, edges, "agent1")
    assert graph is not None


@pytest.mark.skipif(not os.getenv("GEMINI_API_KEY"), reason="GEMINI_API_KEY not set")
@pytest.mark.asyncio
async def test_single_agent_run():
    nodes = [
        {
            "id": "agent1",
            "type": "agent",
            "agent_id": "a1",
            "config": {
                "system_prompt": "You are a helpful assistant.",
                "model": "gemini-2.0-flash",
                "tools": ["calculator"],
                "max_iterations": 3,
            },
        },
    ]
    edges = []

    graph = compile_workflow(nodes, edges, "agent1")

    result = await graph.ainvoke({
        "messages": [{"role": "user", "content": "say hello"}],
        "_next": "",
        "_current_agent_id": None,
        "_agent_configs": {"a1": nodes[0]["config"]},
        "_router_conditions": {},
        "run_id": "test-run-1",
    })

    assert "messages" in result
    assert len(result["messages"]) > 1
