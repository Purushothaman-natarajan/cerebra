"""CRUD endpoints for AI agents including export/import and testing."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.docs import list_response_example, response_example
from app.schemas import AgentCreate, AgentResponse, AgentTestCreate, AgentTestResult, AgentUpdate, DeleteResponse
from app.services import agent_service

router = APIRouter(prefix="/agents", tags=["agents"])

_AGENT_EXAMPLE = {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ResearchAgent",
    "role": "research_assistant",
    "system_prompt": "You are a research assistant. Search the web and summarize findings.",
    "model": "gemini-2.0-flash",
    "tools": ["web_search", "calculator"],
    "channel_id": None,
    "memory_enabled": False,
    "max_iterations": 10,
    "guardrails": {"blocked_topics": ["politics"], "max_tokens": 4096},
    "created_at": "2026-05-13T12:00:00+00:00",
    "updated_at": "2026-05-13T12:00:00+00:00",
}


@router.get("", response_model=list[AgentResponse],
    responses=list_response_example([_AGENT_EXAMPLE]))
async def list_agents(db: AsyncSession = Depends(get_db)):
    """List all configured agents, newest first. No input required.
    
    Returns pre-built default agents when the database is empty.
    """
    agents = await agent_service.list_agents(db)
    if agents:
        return [AgentResponse.from_orm(a) for a in agents]
    # Fall back to default templates when no agents have been created
    try:
        from app.services.agent_template_service import DEFAULT_TEMPLATES
        now = datetime.now(timezone.utc).isoformat()
        return [
            {
                "id": str(uuid4()), "name": t["name"], "role": t["role"],
                "system_prompt": t["system_prompt"], "model": t["model"],
                "tools": t["tools"], "channel_id": None,
                "memory_enabled": t["memory_enabled"],
                "max_iterations": t["max_iterations"],
                "guardrails": t["guardrails"],
                "created_at": now, "updated_at": now,
            }
            for t in DEFAULT_TEMPLATES
        ]
    except Exception:
        return []


@router.post("", status_code=201, response_model=AgentResponse,
    responses={**response_example(_AGENT_EXAMPLE), **{422: {"description": "Validation error"}}})
async def create_agent(body: AgentCreate, db: AsyncSession = Depends(get_db)):
    """Create a new agent with system prompt, model, tools, and guardrails."""
    agent = await agent_service.create_agent(db, body.model_dump())
    return AgentResponse.from_orm(agent)


@router.get("/export", response_model=list[dict])
async def export_agents(db: AsyncSession = Depends(get_db)):
    """Export all agents as a JSON array. No input required."""
    return await agent_service.export_agents(db)


@router.post("/import", response_model=dict, status_code=201)
async def import_agents(body: list[dict], db: AsyncSession = Depends(get_db)):
    """Import agents from a JSON array. Each object must have name, role, system_prompt."""
    count = await agent_service.import_agents(db, body)
    return {"ok": True, "imported": count}


_test_agent_example = {
    "ok": True,
    "output": "Here are the latest trends in AI...",
    "prompt_tokens": 150,
    "completion_tokens": 300,
    "total_tokens": 450,
    "cost": 0.000135,
    "duration_ms": 1234,
}


@router.post("/{agent_id}/test", response_model=AgentTestResult,
    responses={**response_example(_test_agent_example), **{404: {"description": "Agent not found"}}})
async def test_agent(agent_id: str, body: AgentTestCreate, db: AsyncSession = Depends(get_db)):
    """Test an agent with sample input. Returns the agent's response, token usage, cost, and timing."""
    result = await agent_service.test_agent(db, agent_id, body.input)
    if not result.get("ok") and result.get("output") == "Agent not found":
        raise HTTPException(404, "Agent not found")
    return result


@router.get("/{agent_id}", response_model=AgentResponse,
    responses={**response_example(_AGENT_EXAMPLE), **{404: {"description": "Agent not found"}}})
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single agent by UUID."""
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return AgentResponse.from_orm(agent)


@router.patch("/{agent_id}", response_model=AgentResponse,
    responses={**response_example(_AGENT_EXAMPLE), **{404: {"description": "Agent not found"}}})
async def update_agent(agent_id: str, body: AgentUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing agent. Only provided fields are changed."""
    agent = await agent_service.update_agent(db, agent_id, body.model_dump(exclude_none=True))
    if not agent:
        raise HTTPException(404, "Agent not found")
    return AgentResponse.from_orm(agent)


@router.delete("/{agent_id}", response_model=DeleteResponse,
    responses={**response_example({"ok": True}), **{404: {"description": "Agent not found"}}})
async def delete_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an agent by UUID."""
    deleted = await agent_service.delete_agent(db, agent_id)
    if not deleted:
        raise HTTPException(404, "Agent not found")
    return {"ok": True}
