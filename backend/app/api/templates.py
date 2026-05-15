"""Unified template listing — returns pre-built tools, agents, and workflow templates
organized by category. Each template shows category, name, description, and metadata.
"""

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter
from app.docs import list_response_example
from app.runtime.tools.registry import get_tool_definitions

router = APIRouter(prefix="/templates", tags=["templates"])

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"
_cache: list[dict] | None = None
_cache_time: float = 0
_CACHE_TTL = 60

_TEMPLATE_EXAMPLE = {
    "category": "workflows", "name": "Research & Report",
    "description": "ResearchAgent → WriterAgent → ReviewerAgent",
    "node_count": 3, "edge_count": 2, "trigger_type": "manual",
}


@router.get("", response_model=list[dict],
    responses=list_response_example([_TEMPLATE_EXAMPLE]))
async def list_templates():
    """List all pre-built templates organized by category: tools, agents, workflows.
    
    Tools come from the built-in tool registry.
    Agents come from the default agent templates.
    Workflows come from the JSON files in backend/templates/.
    Results are cached for 60 seconds.
    """
    global _cache, _cache_time
    now = time.time()
    if _cache is not None and now - _cache_time < _CACHE_TTL:
        return _cache

    templates = []

    # ── Built-in tools ────────────────────────────────────────────────
    for t in get_tool_definitions():
        templates.append({
            "category": "tools",
            "name": t["name"],
            "description": (t.get("description", "") or "").split(".")[0],
            "tool_id": t["name"],
        })

    # ── Agent templates ───────────────────────────────────────────────
    try:
        from app.services.agent_template_service import DEFAULT_TEMPLATES
        for t in DEFAULT_TEMPLATES:
            templates.append({
                "category": "agents",
                "name": t["name"],
                "description": t["role"],
                "system_prompt": t["system_prompt"],
                "tools": t["tools"],
                "model": t["model"],
            })
    except Exception:
        pass

    # ── Workflow templates (from JSON files) ──────────────────────────
    if TEMPLATES_DIR.exists():
        for path in sorted(TEMPLATES_DIR.glob("*.json")):
            try:
                data = json.loads(path.read_text())
                nodes = data.get("nodes", [])
                templates.append({
                    "category": "workflows",
                    "name": data.get("name", path.stem),
                    "description": _describe(data),
                    "node_count": len(nodes),
                    "edge_count": len(data.get("edges", [])),
                    "trigger_type": data.get("trigger", {}).get("type", "manual"),
                    "nodes": nodes,
                    "edges": data.get("edges", []),
                    "trigger": data.get("trigger", {"type": "manual", "config": {}}),
                })
            except (json.JSONDecodeError, OSError, KeyError) as e:
                logging.warning("Skipping template %s: %s", path.name, e)

    _cache, _cache_time = templates, now
    return templates


def _describe(data: dict) -> str:
    nodes = data.get("nodes", [])
    parts = []
    for n in nodes:
        if n["type"] == "agent":
            prompt = n.get("config", {}).get("system_prompt", "")
            parts.append(prompt.split(".")[0].strip() if prompt else n["id"])
        elif n["type"] == "router":
            parts.append("route conditions")
    return " → ".join(parts) if parts else f"{len(nodes)} nodes"
