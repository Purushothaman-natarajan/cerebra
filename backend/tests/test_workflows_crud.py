import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_workflow(client: AsyncClient):
    payload = {
        "name": "Test Workflow",
        "nodes": [{"id": "agent1", "type": "agent", "config": {}}],
        "edges": [],
    }
    resp = await client.post("/workflows", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Workflow"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_workflows(client: AsyncClient):
    await client.post("/workflows", json={"name": "WF1"})
    await client.post("/workflows", json={"name": "WF2"})

    resp = await client.get("/workflows")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_workflow(client: AsyncClient):
    create = await client.post("/workflows", json={"name": "WF1"})
    wf_id = create.json()["id"]

    resp = await client.get(f"/workflows/{wf_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "WF1"


@pytest.mark.asyncio
async def test_update_workflow(client: AsyncClient):
    create = await client.post("/workflows", json={"name": "WF1"})
    wf_id = create.json()["id"]

    resp = await client.patch(f"/workflows/{wf_id}", json={"name": "Updated"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"


@pytest.mark.asyncio
async def test_delete_workflow(client: AsyncClient):
    create = await client.post("/workflows", json={"name": "WF1"})
    wf_id = create.json()["id"]

    resp = await client.delete(f"/workflows/{wf_id}")
    assert resp.status_code == 200

    resp = await client.get(f"/workflows/{wf_id}")
    assert resp.status_code == 404
