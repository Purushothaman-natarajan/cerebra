"""Agent CRUD business logic."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent


async def list_agents(db: AsyncSession) -> list[Agent]:
    result = await db.execute(select(Agent).order_by(Agent.created_at.desc()))
    return list(result.scalars().all())


async def get_agent(db: AsyncSession, agent_id: str) -> Agent | None:
    result = await db.execute(select(Agent).where(Agent.id == uuid.UUID(agent_id)))
    return result.scalar_one_or_none()


async def create_agent(db: AsyncSession, data: dict) -> Agent:
    clean = _clean_data(data)
    agent = Agent(**clean)
    db.add(agent)
    await db.flush()
    return agent


async def update_agent(db: AsyncSession, agent_id: str, data: dict) -> Agent | None:
    agent = await get_agent(db, agent_id)
    if not agent:
        return None
    clean = _clean_data(data)
    for key, value in clean.items():
        if value is not None:
            setattr(agent, key, value)
    await db.flush()
    return agent


async def delete_agent(db: AsyncSession, agent_id: str) -> bool:
    agent = await get_agent(db, agent_id)
    if not agent:
        return False
    await db.delete(agent)
    await db.flush()
    return True


def _clean_data(data: dict) -> dict:
    """Convert string UUIDs to UUID objects for ORM compatibility."""
    d = dict(data)
    if d.get("channel_id"):
        d["channel_id"] = uuid.UUID(d["channel_id"])
    return d
