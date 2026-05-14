"""Agent CRUD business logic."""

import uuid
import time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.runtime.llm import call_llm_with_tools, estimate_cost
from app.runtime.tools.registry import get_tool, get_tool_definitions


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


async def export_agents(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(Agent).order_by(Agent.created_at.desc()))
    agents = result.scalars().all()
    return [
        {
            "name": a.name, "role": a.role, "system_prompt": a.system_prompt,
            "model": a.model, "tools": a.tools, "memory_enabled": a.memory_enabled,
            "max_iterations": a.max_iterations, "guardrails": a.guardrails,
        }
        for a in agents
    ]


async def import_agents(db: AsyncSession, data_list: list[dict]) -> int:
    count = 0
    for data in data_list:
        if not data.get("name") or not data.get("role") or not data.get("system_prompt"):
            continue
        # Deduplicate by name: skip if name already exists
        existing = await db.execute(select(Agent).where(Agent.name == data["name"]))
        if existing.scalar_one_or_none():
            continue
        clean = _clean_data(data)
        db.add(Agent(**clean))
        count += 1
    await db.flush()
    return count


async def test_agent(db: AsyncSession, agent_id: str, input_message: str) -> dict:
    """Execute a single agent with the given input and return results with timing."""
    agent = await get_agent(db, agent_id)
    if not agent:
        return {"ok": False, "output": "Agent not found", "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost": 0.0, "duration_ms": 0}

    tool_names = agent.tools or []
    tool_defs = [t for t in get_tool_definitions() if t["name"] in tool_names]

    messages = [{"role": "user", "content": input_message}]
    system_prompt = agent.system_prompt or ""
    model = agent.model or "gemini-2.0-flash"
    blocked_topics = agent.guardrails.get("blocked_topics", []) if agent.guardrails else []

    usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost": 0.0}
    start = time.monotonic()

    try:
        iteration = 0
        max_iterations = agent.max_iterations or 10
        while iteration < max_iterations:
            iteration += 1
            result, tool_call, call_usage = await call_llm_with_tools(model, system_prompt, messages, tool_defs)

            if call_usage:
                usage["prompt_tokens"] += call_usage.get("prompt_tokens", 0)
                usage["completion_tokens"] += call_usage.get("completion_tokens", 0)
                usage["total_tokens"] += call_usage.get("total_tokens", 0)
                usage["cost"] += estimate_cost(
                    model,
                    call_usage.get("prompt_tokens", 0),
                    call_usage.get("completion_tokens", 0),
                )

            if tool_call:
                fn = get_tool(tool_call)
                if fn:
                    tool_result = await fn(result)
                    messages.append({"role": "tool", "content": tool_result, "name": tool_call})
            else:
                for topic in blocked_topics:
                    if topic.lower() in result.lower():
                        result = f"Blocked response (contains topic: {topic})"
                        break
                messages.append({"role": "assistant", "content": result})
                break
        else:
            messages.append({
                "role": "assistant",
                "content": "I was unable to complete the request within the allowed steps. Please try a simpler query or increase max_iterations.",
            })

        elapsed = int((time.monotonic() - start) * 1000)
        output = messages[-1]["content"] if messages else ""
        return {
            "ok": True,
            "output": output[:5000],
            "prompt_tokens": usage["prompt_tokens"],
            "completion_tokens": usage["completion_tokens"],
            "total_tokens": usage["total_tokens"],
            "cost": round(usage["cost"], 6),
            "duration_ms": elapsed,
        }

    except Exception as e:
        elapsed = int((time.monotonic() - start) * 1000)
        return {"ok": False, "output": f"Error: {e}", "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost": 0.0, "duration_ms": elapsed}
