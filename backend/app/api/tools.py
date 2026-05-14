"""Custom tool management — built-in + user-defined tools."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.docs import list_response_example, response_example
from app.models.tool import CustomTool
from app.runtime.tools.registry import get_tool_definitions
from app.schemas import ToolCreate, DeleteResponse

router = APIRouter(prefix="/tools", tags=["tools"])

_TOOL_EXAMPLE = {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "name": "slack_notifier",
    "description": "Sends a message to Slack via webhook.",
    "tool_type": "http",
    "config": {"url": "https://hooks.slack.com/xxx", "method": "POST"},
    "is_builtin": False,
    "created_at": "2026-05-13T12:00:00+00:00",
}


@router.get("", response_model=list[dict],
    responses=list_response_example([_TOOL_EXAMPLE, {"name": "web_search", "description": "Search the web", "tool_type": "builtin", "is_builtin": True}]))
async def list_tools(db: AsyncSession = Depends(get_db)):
    """List all tools: built-in + custom. No input required."""
    builtin = [
        {"name": t["name"], "description": t["description"], "tool_type": "builtin", "is_builtin": True}
        for t in get_tool_definitions()
    ]
    result = await db.execute(select(CustomTool).order_by(CustomTool.created_at.desc()))
    custom = [
        {"id": str(t.id), "name": t.name, "description": t.description,
         "tool_type": t.tool_type, "config": t.config, "is_builtin": False,
         "created_at": t.created_at.isoformat()}
        for t in result.scalars().all()
    ]
    return builtin + custom


@router.post("", status_code=201, response_model=dict,
    responses={**response_example(_TOOL_EXAMPLE), **{400: {"description": "Tool name already exists"}}})
async def create_tool(body: ToolCreate, db: AsyncSession = Depends(get_db)):
    """Create a new custom tool (HTTP, Python, or Webhook)."""
    existing = await db.execute(select(CustomTool).where(CustomTool.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Tool with this name already exists")
    tool = CustomTool(name=body.name, description=body.description, tool_type=body.tool_type, config=body.config)
    db.add(tool)
    await db.flush()
    return {"id": str(tool.id), "name": tool.name, "description": tool.description,
            "tool_type": tool.tool_type, "config": tool.config, "is_builtin": False}


@router.delete("/{tool_id}", response_model=DeleteResponse,
    responses={**response_example({"ok": True}), **{404: {"description": "Tool not found"}}})
async def delete_tool(tool_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a custom tool by UUID. Built-in tools cannot be deleted."""
    result = await db.execute(select(CustomTool).where(CustomTool.id == uuid.UUID(tool_id)))
    tool = result.scalar_one_or_none()
    if not tool:
        raise HTTPException(404, "Tool not found")
    await db.delete(tool)
    await db.flush()
    return {"ok": True}
