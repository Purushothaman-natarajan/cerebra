"""Agent template endpoints — list, create, and delete pre-built agent presets."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas import DeleteResponse
from app.services import agent_template_service

router = APIRouter(prefix="/agent-templates", tags=["agent-templates"])

_TEMPLATE_EXAMPLE = {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "name": "Research Assistant",
    "role": "research",
    "system_prompt": "You are a research assistant...",
    "model": "gemini-2.0-flash",
    "tools": ["web_search", "calculator"],
    "memory_enabled": False,
    "max_iterations": 10,
    "guardrails": {"blocked_topics": [], "max_tokens": 4096},
    "is_default": True,
    "created_at": "2026-05-14T12:00:00+00:00",
}


def _format_template(t: dict | object) -> dict:
    """Convert a template (ORM model or dict) to the standard response format."""
    now = datetime.now(timezone.utc).isoformat()
    if isinstance(t, dict):
        return {
            "id": str(t.get("id", "")),
            "name": t.get("name", ""),
            "role": t.get("role", ""),
            "system_prompt": t.get("system_prompt", ""),
            "model": t.get("model", ""),
            "tools": t.get("tools", []),
            "memory_enabled": t.get("memory_enabled", False),
            "max_iterations": t.get("max_iterations", 10),
            "guardrails": t.get("guardrails", {}),
            "is_default": t.get("is_default", True),
            "created_at": t.get("created_at", now) if isinstance(t.get("created_at"), str) else t.get("created_at", now).isoformat() if hasattr(t.get("created_at", now), "isoformat") else now,
        }
    # ORM model instance
    return {
        "id": str(t.id) if t.id else "",
        "name": t.name,
        "role": t.role,
        "system_prompt": t.system_prompt,
        "model": t.model,
        "tools": t.tools,
        "memory_enabled": t.memory_enabled,
        "max_iterations": t.max_iterations,
        "guardrails": t.guardrails,
        "is_default": t.is_default,
        "created_at": t.created_at.isoformat() if hasattr(t.created_at, "isoformat") else str(t.created_at),
    }


@router.get("", response_model=list[dict])
async def list_agent_templates(db: AsyncSession = Depends(get_db)):
    """List all agent templates, newest first. No input required."""
    try:
        templates = await agent_template_service.list_templates(db)
    except Exception:
        templates = []

    # If DB has no templates, fall back to in-memory defaults
    if not templates:
        try:
            from app.services.agent_template_service import DEFAULT_TEMPLATES
            return [_format_template(t) for t in DEFAULT_TEMPLATES]
        except Exception:
            return []

    return [_format_template(t) for t in templates]


@router.post("", status_code=201, response_model=dict)
async def create_agent_template(body: dict, db: AsyncSession = Depends(get_db)):
    """Create a custom agent template from JSON body."""
    required = ["name", "role", "system_prompt"]
    for field in required:
        if field not in body or not body[field]:
            raise HTTPException(400, f"Missing required field: {field}")
    tmpl = await agent_template_service.create_template(db, body)
    return {"id": str(tmpl.id), "name": tmpl.name, "role": tmpl.role,
            "system_prompt": tmpl.system_prompt, "model": tmpl.model,
            "tools": tmpl.tools, "memory_enabled": tmpl.memory_enabled,
            "max_iterations": tmpl.max_iterations, "guardrails": tmpl.guardrails,
            "is_default": tmpl.is_default}


@router.delete("/{template_id}", response_model=DeleteResponse)
async def delete_agent_template(template_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an agent template by UUID. Non-default templates only."""
    deleted = await agent_template_service.delete_template(db, template_id)
    if not deleted:
        raise HTTPException(404, "Agent template not found")
    return {"ok": True}
