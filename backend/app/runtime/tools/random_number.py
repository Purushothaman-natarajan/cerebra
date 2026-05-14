"""Random number generation tool."""

import random
import json
from app.runtime.tools.registry import register


@register("random_number")
async def random_number(params: str) -> str:
    """Generate a random number. Input: JSON with optional keys: min (default 0), max (default 100), count (default 1), unique (default false). Output: number or list of numbers."""
    try:
        cfg = json.loads(params) if isinstance(params, str) else params
    except json.JSONDecodeError:
        return "Error: Invalid JSON input. Use format: {\"min\": 0, \"max\": 100, \"count\": 1}"

    low = int(cfg.get("min", 0))
    high = int(cfg.get("max", 100))
    count = int(cfg.get("count", 1))
    unique = bool(cfg.get("unique", False))

    if low > high:
        return "Error: min must be <= max"
    if count < 1:
        return "Error: count must be >= 1"
    if unique and (high - low + 1) < count:
        return "Error: range too small for unique count"

    if count == 1:
        return str(random.randint(low, high))

    if unique:
        return json.dumps(random.sample(range(low, high + 1), count))
    return json.dumps([random.randint(low, high) for _ in range(count)])
