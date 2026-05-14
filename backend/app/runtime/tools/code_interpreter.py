"""Small Python interpreter tool with restricted built-ins and captured output."""

import contextlib
import io
import json
import math
import re
import statistics
from datetime import datetime, timezone
from typing import Any

from app.runtime.tools.registry import register

_ALLOWED_MODULES = {
    "json": json,
    "math": math,
    "re": re,
    "statistics": statistics,
}

_SAFE_BUILTINS: dict[str, Any] = {
    "abs": abs,
    "all": all,
    "any": any,
    "bool": bool,
    "dict": dict,
    "enumerate": enumerate,
    "float": float,
    "int": int,
    "len": len,
    "list": list,
    "max": max,
    "min": min,
    "pow": pow,
    "print": print,
    "range": range,
    "round": round,
    "set": set,
    "sorted": sorted,
    "str": str,
    "sum": sum,
    "tuple": tuple,
    "zip": zip,
}


def _safe_import(name: str, *args: Any, **kwargs: Any) -> Any:
    if name in _ALLOWED_MODULES:
        return _ALLOWED_MODULES[name]
    raise ImportError(f"Module '{name}' is not available in the sandbox")


def _parse_payload(payload: str) -> tuple[str, Any]:
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return payload, payload

    if isinstance(data, dict):
        return str(data.get("code", "")), data.get("input", "")
    return payload, data


@register("code_interpreter")
async def code_interpreter(payload: str) -> str:
    """Run short Python snippets in a restricted sandbox. Input: code or JSON with code/input. Output: stdout plus result variable."""
    code, user_input = _parse_payload(payload)
    if not code.strip():
        return "Error: No Python code provided"

    safe_builtins = {**_SAFE_BUILTINS, "__import__": _safe_import}
    stdout = io.StringIO()
    globals_ns = {
        "__builtins__": safe_builtins,
        "json": json,
        "math": math,
        "re": re,
        "statistics": statistics,
        "datetime": datetime,
        "timezone": timezone,
    }
    locals_ns: dict[str, Any] = {"input": user_input}

    try:
        with contextlib.redirect_stdout(stdout):
            exec(code, globals_ns, locals_ns)
    except Exception as exc:
        return f"Error: {exc}"

    output = stdout.getvalue().strip()
    result = locals_ns.get("result", locals_ns.get("output"))
    parts = []
    if output:
        parts.append(output)
    if result is not None:
        parts.append(str(result))
    return "\n".join(parts)[:5000] if parts else "No output"
