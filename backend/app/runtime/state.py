"""LangGraph workflow state type definition.

WorkflowState is the shared state dict passed between nodes in the graph.
Each node reads and writes to this state during workflow execution.
"""

from typing import Any, TypedDict


class WorkflowState(TypedDict):
    """State passed between LangGraph nodes during workflow execution."""
    messages: list[dict]
    _next: str
    _current_agent_id: str | None
    _agent_configs: dict[str, Any]
    _router_conditions: dict[str, Any]
    run_id: str | None
