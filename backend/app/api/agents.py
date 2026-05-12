from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas import AgentCreate, AgentResponse, AgentUpdate
from app.services import agent_service

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("")
async def list_agents(db: AsyncSession = Depends(get_db)):
    agents = await agent_service.list_agents(db)
    return [AgentResponse.from_orm(a) for a in agents]


@router.get("/{agent_id}")
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return AgentResponse.from_orm(agent)


@router.post("", status_code=201)
async def create_agent(body: AgentCreate, db: AsyncSession = Depends(get_db)):
    agent = await agent_service.create_agent(db, body.model_dump())
    return AgentResponse.from_orm(agent)


@router.patch("/{agent_id}")
async def update_agent(agent_id: str, body: AgentUpdate, db: AsyncSession = Depends(get_db)):
    agent = await agent_service.update_agent(db, agent_id, body.model_dump(exclude_none=True))
    if not agent:
        raise HTTPException(404, "Agent not found")
    return AgentResponse.from_orm(agent)


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await agent_service.delete_agent(db, agent_id)
    if not deleted:
        raise HTTPException(404, "Agent not found")
    return {"ok": True}
