"""Custom tool business logic — export/import."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tool import CustomTool


async def export_tools(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(CustomTool).order_by(CustomTool.created_at.desc()))
    tools = result.scalars().all()
    return [
        {
            "name": t.name, "description": t.description,
            "tool_type": t.tool_type, "config": t.config,
        }
        for t in tools
    ]


async def import_tools(db: AsyncSession, data_list: list[dict]) -> int:
    count = 0
    for data in data_list:
        if not data.get("name"):
            continue
        existing = await db.execute(select(CustomTool).where(CustomTool.name == data["name"]))
        if existing.scalar_one_or_none():
            continue
        db.add(CustomTool(
            name=data["name"],
            description=data.get("description", ""),
            tool_type=data.get("tool_type", "http"),
            config=data.get("config", {}),
        ))
        count += 1
    await db.flush()
    return count
