"""Custom tool management — built-in tools merged with user-defined HTTP/Python/Webhook tools."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.tool import CustomTool
from app.runtime.tools.registry import get_tool_definitions
from app.schemas import ToolCreate, DeleteResponse

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get("", response_model=list[dict])
async def list_tools(db: AsyncSession = Depends(get_db)):
    """List all available tools: built-in + custom. No input required.

    Built-in tools (web_search, calculator, http_request, web_crawler)
    are registered via decorators and have is_builtin=True.
    Custom tools are stored in the database and can be edited/deleted.
    """
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
    responses={400: {"description": "Tool name already exists"}})
async def create_tool(body: ToolCreate, db: AsyncSession = Depends(get_db)):
    """Create a new custom tool.

    HTTP tools: specify url, method, optional parameters with types.
    Python tools: provide run() function code.
    Webhook tools: provide webhook URL and event trigger.
    """
    existing = await db.execute(select(CustomTool).where(CustomTool.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Tool with this name already exists")
    tool = CustomTool(
        name=body.name, description=body.description,
        tool_type=body.tool_type, config=body.config,
    )
    db.add(tool)
    await db.flush()
    return {"id": str(tool.id), "name": tool.name, "description": tool.description,
            "tool_type": tool.tool_type, "config": tool.config, "is_builtin": False}


@router.delete("/{tool_id}", response_model=DeleteResponse,
    responses={404: {"description": "Tool not found"}})
async def delete_tool(tool_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a custom tool by UUID. Built-in tools cannot be deleted."""
    result = await db.execute(select(CustomTool).where(CustomTool.id == uuid.UUID(tool_id)))
    tool = result.scalar_one_or_none()
    if not tool:
        raise HTTPException(404, "Tool not found")
    await db.delete(tool)
    await db.flush()
    return {"ok": True}
