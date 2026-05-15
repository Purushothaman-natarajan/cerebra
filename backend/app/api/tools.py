"""Custom tool management — built-in + user-defined tools with export/import."""

import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.docs import list_response_example, response_example
from app.models.tool import CustomTool
import app.runtime.tools  # noqa: F401 - import built-ins so decorators populate the registry
from app.runtime.tools.registry import call_tool, get_tool, get_tool_definitions
from app.schemas import ToolCreate, ToolTest, ToolTestResult, DeleteResponse
from app.services import tool_service

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
    responses=list_response_example([_TOOL_EXAMPLE, {"id": None, "tool_id": "web_search", "name": "web_search", "description": "Search the web", "tool_type": "builtin", "is_builtin": True}]))
async def list_tools(db: AsyncSession = Depends(get_db)):
    """List all tools: built-in + custom. No input required."""
    builtin = [
        {"id": None, "tool_id": t["name"], "name": t["name"], "description": t["description"], "tool_type": "builtin", "is_builtin": True}
        for t in get_tool_definitions()
    ]
    try:
        result = await db.execute(select(CustomTool).order_by(CustomTool.created_at.desc()))
        custom = [
            {"id": str(t.id), "tool_id": str(t.id), "name": t.name, "description": t.description,
             "tool_type": t.tool_type, "config": t.config, "is_builtin": False,
             "created_at": t.created_at.isoformat()}
            for t in result.scalars().all()
        ]
    except Exception as exc:
        logging.warning("Could not load custom tools; returning built-ins only: %s", exc)
        custom = []
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


@router.post("/test", response_model=ToolTestResult,
    responses={**response_example({"ok": True, "output": "HTTP 200: OK", "duration_ms": 1234}),
               **{404: {"description": "Tool not found"}, 400: {"description": "Execution failed"}}})
async def test_tool(body: ToolTest, db: AsyncSession = Depends(get_db)):
    """Test a custom tool with sample input and see the output.

    For HTTP tools: makes the configured HTTP request with the input as body/param.
    For Python tools: executes the code in a restricted sandbox.
    Returns the output text and execution duration.
    """
    import httpx
    import time

    logger = logging.getLogger(__name__)
    try:
        tool_uuid = None
        try:
            tool_uuid = uuid.UUID(body.tool_id or "")
        except Exception:
            # Not a UUID — treat as built-in name
            fn = get_tool(body.tool_id)
            if not fn:
                raise HTTPException(404, "Tool not found")

            start = time.monotonic()
            try:
                result = await call_tool(body.tool_id, body.input)
                elapsed = int((time.monotonic() - start) * 1000)
                return {"ok": True, "output": str(result)[:5000], "duration_ms": elapsed}
            except Exception as e:
                elapsed = int((time.monotonic() - start) * 1000)
                logger.exception("Built-in tool execution failed: %s", e)
                return {"ok": False, "output": f"Error: {e}", "duration_ms": elapsed}

        # If we have a UUID, fetch custom tool
        result = await db.execute(select(CustomTool).where(CustomTool.id == tool_uuid))
        tool = result.scalar_one_or_none()
        if not tool:
            raise HTTPException(404, "Tool not found")

        start = time.monotonic()
        try:
            if tool.tool_type == "http":
                url = tool.config.get("url", "")
                method = tool.config.get("method", "POST").upper()
                headers = tool.config.get("headers", {})

                async with httpx.AsyncClient(timeout=15) as client:
                    if method == "GET":
                        resp = await client.get(url, params={"input": body.input}, headers=headers)
                    else:
                        resp = await client.post(url, json={"input": body.input}, headers=headers)

                elapsed = int((time.monotonic() - start) * 1000)
                return {"ok": resp.status_code < 500, "output": f"HTTP {resp.status_code}: {resp.text[:1000]}", "duration_ms": elapsed}

            elif tool.tool_type == "python":
                code = tool.config.get("code", "")
                if not code:
                    raise HTTPException(400, "No Python code defined for this tool")

                # Restricted sandbox — safe builtins only, no imports
                safe_builtins = {
                    "abs": abs, "all": all, "any": any, "bool": bool,
                    "dict": dict, "enumerate": enumerate, "float": float,
                    "int": int, "len": len, "list": list, "max": max,
                    "min": min, "pow": pow, "print": print, "range": range,
                    "round": round, "set": set, "sorted": sorted,
                    "str": str, "sum": sum, "tuple": tuple, "zip": zip,
                    "True": True, "False": False, "None": None,
                }
                local_ns: dict = {"input": body.input}
                exec(code, {"__builtins__": safe_builtins}, local_ns)
                result_val = local_ns.get("result", local_ns.get("output", ""))

                elapsed = int((time.monotonic() - start) * 1000)
                return {"ok": True, "output": str(result_val)[:2000], "duration_ms": elapsed}

            else:
                raise HTTPException(400, f"Unsupported tool type: {tool.tool_type}")

        except HTTPException:
            raise
        except Exception as e:
            elapsed = int((time.monotonic() - start) * 1000)
            logger.exception("Custom tool execution failed: %s", e)
            return {"ok": False, "output": f"Error: {e}", "duration_ms": elapsed}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("test_tool: unexpected error: %s", e)
        raise HTTPException(500, "Tool test failed")


@router.post("/test-builtin", response_model=dict,
    responses={**response_example({"ok": True, "output": "2026-05-14 12:00:00", "duration_ms": 12}),
               **{400: {"description": "Tool not found or execution failed"}, 404: {"description": "Built-in tool not found"}}})
async def test_builtin_tool(body: ToolTest, db: AsyncSession = Depends(get_db)):
    """Test a built-in tool by name with sample input. Returns output and duration."""
    import time

    fn = get_tool(body.tool_id)
    if not fn:
        raise HTTPException(404, f"Built-in tool not found: {body.tool_id}")

    start = time.monotonic()
    try:
        result = await call_tool(body.tool_id, body.input)
        elapsed = int((time.monotonic() - start) * 1000)
        return {"ok": True, "output": str(result)[:5000], "duration_ms": elapsed}
    except Exception as e:
        elapsed = int((time.monotonic() - start) * 1000)
        return {"ok": False, "output": f"Error: {e}", "duration_ms": elapsed}


@router.get("/export", response_model=list[dict])
async def export_tools_endpoint(db: AsyncSession = Depends(get_db)):
    """Export all custom tools as a JSON array. No input required."""
    return await tool_service.export_tools(db)


@router.post("/import", response_model=dict, status_code=201)
async def import_tools_endpoint(body: list[dict], db: AsyncSession = Depends(get_db)):
    """Import custom tools from a JSON array. Each object must have a name."""
    count = await tool_service.import_tools(db, body)
    return {"ok": True, "imported": count}


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


