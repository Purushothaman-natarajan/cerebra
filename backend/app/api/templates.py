"""Template listing with caching — reads templates from disk, caches for 60 seconds."""

import json
import logging
import time
from pathlib import Path

from fastapi import APIRouter

from app.docs import list_response_example

router = APIRouter(prefix="/templates", tags=["templates"])

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"
_cache: list[dict] | None = None
_cache_time: float = 0
_CACHE_TTL = 60

_TEMPLATE_EXAMPLE = {
    "name": "Research & Report",
    "description": "ResearchAgent → WriterAgent → ReviewerAgent",
    "node_count": 3,
    "edge_count": 2,
    "trigger_type": "manual",
    "nodes": [{"id": "researcher", "type": "agent", "config": {"system_prompt": "...", "tools": ["web_search"]}}],
    "edges": [{"source": "researcher", "target": "writer", "condition": None}],
    "trigger": {"type": "manual", "config": {}},
}


@router.get("", response_model=list[dict],
    responses=list_response_example([_TEMPLATE_EXAMPLE, {"name": "Support Triage", "description": "Triage → Route → Specialize", "node_count": 5, "edge_count": 4, "trigger_type": "telegram"}]))
async def list_templates():
    """List all available workflow templates, cached for 60 seconds. No input required."""
    global _cache, _cache_time
    now = time.time()
    if _cache is not None and now - _cache_time < _CACHE_TTL:
        return _cache
    templates = []
    if not TEMPLATES_DIR.exists():
        _cache, _cache_time = [], now
        return templates
    for path in sorted(TEMPLATES_DIR.glob("*.json")):
        try:
            data = json.loads(path.read_text())
            templates.append({
                "name": data.get("name", path.stem), "description": _describe(data),
                "node_count": len(data.get("nodes", [])), "edge_count": len(data.get("edges", [])),
                "trigger_type": data.get("trigger", {}).get("type", "manual"),
                "nodes": data.get("nodes", []), "edges": data.get("edges", []),
                "trigger": data.get("trigger", {"type": "manual", "config": {}}),
            })
        except (json.JSONDecodeError, OSError, KeyError) as e:
            logging.warning("Skipping template %s: %s", path.name, e)
            continue
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
