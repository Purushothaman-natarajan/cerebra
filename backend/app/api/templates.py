import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/templates", tags=["templates"])

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "templates"


@router.get("")
async def list_templates():
    templates = []
    if not TEMPLATES_DIR.exists():
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
        except (json.JSONDecodeError, OSError):
            continue

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
