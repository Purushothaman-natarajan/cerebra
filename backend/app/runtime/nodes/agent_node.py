from app.runtime.llm import call_llm_with_tools
from app.runtime.tools.registry import get_tool, get_tool_definitions


async def agent_node(state: dict) -> dict:
    agent_id = state.get("_current_agent_id")
    agent_configs = state.get("_agent_configs", {})
    agent_config = agent_configs.get(agent_id, {})

    system_prompt = agent_config.get("system_prompt", "")
    model = agent_config.get("model", "gemini-2.0-flash")
    tool_names = agent_config.get("tools", [])
    max_iterations = agent_config.get("max_iterations", 10)
    guardrails = agent_config.get("guardrails", {})
    blocked_topics = guardrails.get("blocked_topics", [])

    messages = state.get("messages", [])
    tool_defs = [t for t in get_tool_definitions() if t["name"] in tool_names]

    iteration = 0
    while iteration < max_iterations:
        iteration += 1
        result, tool_call = await call_llm_with_tools(model, system_prompt, messages, tool_defs)

        if tool_call:
            fn = get_tool(tool_call)
            if fn:
                tool_result = await fn(result)
                messages.append({"role": "tool", "content": tool_result, "name": tool_call})
        else:
            for topic in blocked_topics:
                if topic.lower() in result.lower():
                    result = f"Blocked response (contains topic: {topic})"
                    break
            messages.append({"role": "assistant", "content": result})
            break
    else:
        messages.append({"role": "assistant", "content": "I apologize, but I was unable to complete the request within the allowed number of steps. Please try a simpler query or increase the max_iterations setting."})

    return {"messages": messages}
