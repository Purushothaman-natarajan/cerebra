"""Custom tool CRUD endpoints.

Built-in tools (registered via decorators) are returned alongside
user-defined custom tools from the database.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.tool import CustomTool
from app.runtime.tools.registry import get_tool_definitions

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("")
async def list_tools(db: AsyncSession = Depends(get_db)):
    """List all tools: built-in + custom. Built-in tools have is_builtin=True."""
    builtin = [
        {"name": t["name"], "description": t["description"], "tool_type": "builtin", "is_builtin": True}
        for t in get_tool_definitions()
    ]
    result = await db.execute(select(CustomTool).order_by(CustomTool.created_at.desc()))
    custom = [
        {
            "id": str(t.id), "name": t.name, "description": t.description,
            "tool_type": t.tool_type, "config": t.config, "is_builtin": False,
            "created_at": t.created_at.isoformat(),
        }
        for t in result.scalars().all()
    ]
    return builtin + custom


@router.post("", status_code=201)
async def create_tool(body: dict, db: AsyncSession = Depends(get_db)):
    """Create a new custom tool."""
    existing = await db.execute(select(CustomTool).where(CustomTool.name == body["name"]))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Tool with this name already exists")
    tool = CustomTool(name=body["name"], description=body.get("description", ""), tool_type=body.get("tool_type", "http"), config=body.get("config", {}))
    db.add(tool)
    await db.flush()
    return {"id": str(tool.id), "name": tool.name, "description": tool.description, "tool_type": tool.tool_type, "config": tool.config, "is_builtin": False}


@router.delete("/{tool_id}")
async def delete_tool(tool_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a custom tool by ID."""
    result = await db.execute(select(CustomTool).where(CustomTool.id == uuid.UUID(tool_id)))
    tool = result.scalar_one_or_none()
    if not tool:
        raise HTTPException(404, "Tool not found")
    await db.delete(tool)
    await db.flush()
    return {"ok": True}
