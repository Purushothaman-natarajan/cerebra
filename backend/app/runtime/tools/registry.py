"""Decorative tool registry — functions register themselves as callable tools.

Usage:
    @register("my_tool")
    async def my_tool(param: str) -> str:
        \"\"\"Description shown to LLM.\"\"\"
        ...
"""

import logging
import time
from typing import Any, Callable, Coroutine

logger = logging.getLogger(__name__)

ToolFn = Callable[..., Coroutine[Any, Any, str]]

_registry: dict[str, ToolFn] = {}


def register(name: str):
    """Decorator to register an async function as a callable tool."""
    def decorator(fn: ToolFn):
        _registry[name] = fn
        return fn
    return decorator


def get_tool(name: str) -> ToolFn | None:
    """Get a registered tool function by name."""
    return _registry.get(name)


def list_tools() -> list[str]:
    """List all registered tool names."""
    return list(_registry.keys())


def get_tool_definitions() -> list[dict]:
    """Get tool definitions for LLM function calling API."""
    return [
        {"name": name, "description": fn.__doc__ or ""}
        for name, fn in _registry.items()
    ]


async def call_tool(name: str, input_str: str) -> str:
    """Call a registered tool with structured logging.

    Logs the tool name, input length, duration, and success/failure.
    This should be used instead of directly calling ``await fn(input)``
    to ensure all tool executions are observable.
    """
    fn = _registry.get(name)
    if not fn:
        logger.warning("Tool not found", extra={"tool": name})
        return f"Error: Tool '{name}' not found"

    start = time.monotonic()
    input_preview = input_str[:200] + ("..." if len(input_str) > 200 else "")
    try:
        result = await fn(input_str)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.info("Tool execution", extra={
            "tool": name, "input_length": len(input_str),
            "output_length": len(result), "duration_ms": elapsed_ms,
            "input_preview": input_preview, "success": True,
        })
        return result
    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.error("Tool execution failed", extra={
            "tool": name, "input_length": len(input_str),
            "duration_ms": elapsed_ms, "input_preview": input_preview,
            "error": str(exc), "success": False,
        })
        return f"Error: Tool '{name}' execution failed: {exc}"
