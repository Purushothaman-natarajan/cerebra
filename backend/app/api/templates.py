"""Template listing endpoint with in-memory caching.

Reads workflow template JSON files from the templates/ directory
and caches them in memory for 60 seconds to avoid repeated disk I/O.
Templates provide pre-built multi-agent workflows that users can import.
"""

import json
import time
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/templates", tags=["templates"])

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "templates"
_cache: list[dict] | None = None
_cache_time: float = 0
_CACHE_TTL = 60  # seconds


@router.get("")
async def list_templates():
    """List all available workflow templates, cached for 60 seconds."""
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
                "name": data.get("name", path.stem),
                "description": _describe(data),
                "node_count": len(data.get("nodes", [])),
                "edge_count": len(data.get("edges", [])),
                "trigger_type": data.get("trigger", {}).get("type", "manual"),
                "nodes": data.get("nodes", []),
                "edges": data.get("edges", []),
                "trigger": data.get("trigger", {"type": "manual", "config": {}}),
            })
        except (json.JSONDecodeError, OSError, KeyError) as e:
            import logging
            logging.warning("Skipping template %s: %s", path.name, e)
            continue

    _cache, _cache_time = templates, now
    return templates


def _describe(data: dict) -> str:
    """Generate a human-readable description from a template's node prompts."""
    nodes = data.get("nodes", [])
    parts = []
    for n in nodes:
        if n["type"] == "agent":
            prompt = n.get("config", {}).get("system_prompt", "")
            parts.append(prompt.split(".")[0].strip() if prompt else n["id"])
        elif n["type"] == "router":
            parts.append("route conditions")
    return " → ".join(parts) if parts else f"{len(nodes)} nodes"
