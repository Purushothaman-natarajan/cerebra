from typing import Any, Callable, Coroutine

ToolFn = Callable[..., Coroutine[Any, Any, str]]

_registry: dict[str, ToolFn] = {}


def register(name: str):
    def decorator(fn: ToolFn):
        _registry[name] = fn
        return fn
    return decorator


def get_tool(name: str) -> ToolFn | None:
    return _registry.get(name)


def list_tools() -> list[str]:
    return list(_registry.keys())


def get_tool_definitions() -> list[dict]:
    return [
        {"name": name, "description": fn.__doc__ or ""}
        for name, fn in _registry.items()
    ]
