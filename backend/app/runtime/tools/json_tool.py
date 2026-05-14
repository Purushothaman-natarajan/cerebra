"""JSON manipulation tool — validate, format, transform JSON strings."""

import json
from app.runtime.tools.registry import register


@register("json_tool")
async def json_tool(params: str) -> str:
    """Manipulate JSON: validate, format, or extract. Input: JSON with 'action' (validate/format/extract), 'json' (the JSON string), and optional 'key' (for extract). Output: result string."""
    try:
        cfg = json.loads(params)
    except json.JSONDecodeError:
        return "Error: Input must be valid JSON with keys: action, json"

    action = cfg.get("action", "validate")
    json_str = cfg.get("json", "")

    try:
        parsed = json.loads(json_str) if isinstance(json_str, str) else json_str
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {e}"

    if action == "validate":
        return "Valid JSON"

    if action == "format":
        return json.dumps(parsed, indent=2, ensure_ascii=False)

    if action == "extract":
        key = cfg.get("key", "")
        if not key:
            return "Error: 'key' required for extract action"
        value = parsed
        for part in key.split("."):
            if isinstance(value, dict) and part in value:
                value = value[part]
            elif isinstance(value, list) and part.isdigit():
                value = value[int(part)]
            else:
                return f"Key '{key}' not found"
        return json.dumps(value, indent=2, ensure_ascii=False) if not isinstance(value, (str, int, float, bool)) else str(value)

    return f"Unknown action: {action}. Use validate, format, or extract."
