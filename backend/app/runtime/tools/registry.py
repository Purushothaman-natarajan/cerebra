"""Decorative tool registry — functions register themselves as callable tools.

Usage:
    @register("my_tool")
    async def my_tool(param: str) -> str:
        \"\"\"Description shown to LLM.\"\"\"
        ...
"""

from typing import Any, Callable, Coroutine

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
