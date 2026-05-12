import os

import pytest

from app.runtime.executor import run_workflow


@pytest.mark.skipif(not os.getenv("GEMINI_API_KEY"), reason="GEMINI_API_KEY not set")
@pytest.mark.asyncio
async def test_run_workflow_returns_run_id():
    workflow_def = {
        "nodes": [
            {
                "id": "agent1",
                "type": "agent",
                "config": {
                    "system_prompt": "You are helpful.",
                    "model": "gemini-2.0-flash",
                    "tools": [],
                    "max_iterations": 1,
                },
            },
        ],
        "edges": [],
        "entry_node": "agent1",
    }

    run_id = await run_workflow(workflow_def, "say hello")
    assert run_id is not None
    assert isinstance(run_id, str)
