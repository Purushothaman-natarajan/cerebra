from typing import Any, TypedDict


class WorkflowState(TypedDict):
    messages: list[dict]
    _next: str
    _current_agent_id: str | None
    _agent_configs: dict[str, Any]
    _router_conditions: dict[str, Any]
    run_id: str | None
