"""Router node for LangGraph — keyword-based conditional routing.

Evaluates the last assistant message against configured keyword lists
and sets _next to the matching route name. The compiler then routes
to the edge whose condition matches that route name.
"""


def router_node(state: dict) -> dict:
    """Route based on keyword matching on the last message.

    Reads _router_conditions from state (dict of route_name -> keyword list).
    Returns _next set to the first matching route name or "default".
    """
    conditions = state.get("_router_conditions", {})
    messages = state.get("messages", [])

    if not messages:
        return {"_next": "default"}

    last = messages[-1].get("content", "").lower()
    for route, keywords in conditions.items():
        if any(kw.lower() in last for kw in keywords):
            return {"_next": route}

    return {"_next": "default"}
