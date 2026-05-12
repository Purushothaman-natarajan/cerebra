import os

import pytest
from httpx import AsyncClient


@pytest.mark.skipif(not os.getenv("GEMINI_API_KEY"), reason="GEMINI_API_KEY not set")
@pytest.mark.asyncio
async def test_trigger_run_creates_run(client: AsyncClient):
    wf_resp = await client.post("/workflows", json={
        "name": "test",
        "nodes": [{"id": "a1", "type": "agent", "agent_id": "test", "config": {"system_prompt": "hi"}}],
        "edges": [],
    })
    assert wf_resp.status_code == 201
    wf_id = wf_resp.json()["id"]

    resp = await client.post("/runs", json={"workflow_id": wf_id, "input": "hello"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] in ("completed", "running", "failed")
