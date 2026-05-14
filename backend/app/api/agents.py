"""CRUD endpoints for AI agents — each has a system prompt, model, tools, memory, guardrails."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas import AgentCreate, AgentResponse, AgentUpdate, DeleteResponse
from app.services import agent_service

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=list[AgentResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    """List all configured agents, newest first. No input required."""
    agents = await agent_service.list_agents(db)
    return [AgentResponse.from_orm(a) for a in agents]


@router.get("/{agent_id}", response_model=AgentResponse,
    responses={404: {"description": "Agent not found"}})
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single agent by UUID."""
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return AgentResponse.from_orm(agent)


@router.post("", status_code=201, response_model=AgentResponse,
    responses={422: {"description": "Validation error"}})
async def create_agent(body: AgentCreate, db: AsyncSession = Depends(get_db)):
    """Create a new agent with system prompt, model, tools, and guardrails.

    At minimum, provide name, role, and system_prompt.
    Tools must be registered in the tool registry (built-in or custom).
    """
    agent = await agent_service.create_agent(db, body.model_dump())
    return AgentResponse.from_orm(agent)


@router.patch("/{agent_id}", response_model=AgentResponse,
    responses={404: {"description": "Agent not found"}})
async def update_agent(agent_id: str, body: AgentUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing agent. Only provided fields are changed (partial update)."""
    agent = await agent_service.update_agent(db, agent_id, body.model_dump(exclude_none=True))
    if not agent:
        raise HTTPException(404, "Agent not found")
    return AgentResponse.from_orm(agent)


@router.delete("/{agent_id}", response_model=DeleteResponse,
    responses={404: {"description": "Agent not found"}})
async def delete_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an agent by UUID."""
    deleted = await agent_service.delete_agent(db, agent_id)
    if not deleted:
        raise HTTPException(404, "Agent not found")
    return {"ok": True}
