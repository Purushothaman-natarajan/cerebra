import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_agent(client: AsyncClient):
    payload = {
        "name": "Test Agent",
        "role": "assistant",
        "system_prompt": "You are a helpful assistant.",
        "model": "gemini-2.0-flash",
        "tools": ["calculator"],
    }
    resp = await client.post("/agents", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Agent"
    assert data["model"] == "gemini-2.0-flash"
    assert data["tools"] == ["calculator"]
    assert "id" in data


@pytest.mark.asyncio
async def test_list_agents(client: AsyncClient):
    await client.post("/agents", json={"name": "A1", "role": "r1", "system_prompt": "p1"})
    await client.post("/agents", json={"name": "A2", "role": "r2", "system_prompt": "p2"})

    resp = await client.get("/agents")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_agent(client: AsyncClient):
    create_resp = await client.post("/agents", json={"name": "A1", "role": "r1", "system_prompt": "p1"})
    agent_id = create_resp.json()["id"]

    resp = await client.get(f"/agents/{agent_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "A1"


@pytest.mark.asyncio
async def test_update_agent(client: AsyncClient):
    create_resp = await client.post("/agents", json={"name": "A1", "role": "r1", "system_prompt": "p1"})
    agent_id = create_resp.json()["id"]

    resp = await client.patch(f"/agents/{agent_id}", json={"name": "Updated"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"


@pytest.mark.asyncio
async def test_delete_agent(client: AsyncClient):
    create_resp = await client.post("/agents", json={"name": "A1", "role": "r1", "system_prompt": "p1"})
    agent_id = create_resp.json()["id"]

    resp = await client.delete(f"/agents/{agent_id}")
    assert resp.status_code == 200

    resp = await client.get(f"/agents/{agent_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_agent_not_found(client: AsyncClient):
    resp = await client.get("/agents/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
