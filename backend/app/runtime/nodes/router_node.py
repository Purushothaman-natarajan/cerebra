def router_node(state: dict) -> dict:
    conditions = state.get("_router_conditions", {})
    messages = state.get("messages", [])

    if not messages:
        return {"_next": "default"}

    last = messages[-1].get("content", "").lower()
    for route, keywords in conditions.items():
        if any(kw.lower() in last for kw in keywords):
            return {"_next": route}

    return {"_next": "default"}
