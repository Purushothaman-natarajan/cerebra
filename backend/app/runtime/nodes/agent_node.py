"""Agent execution node for LangGraph.

Each agent node runs an LLM call loop: the model responds with either text
or a tool call. Tool calls are executed and results fed back to the model.
The loop continues until the model produces text or max_iterations is reached.
"""

from app.runtime.llm import call_llm_with_tools
from app.runtime.tools.registry import get_tool, get_tool_definitions


async def agent_node(state: dict) -> dict:
    """Execute an agent node: LLM call + optional tool execution loop.

    Reads agent config from state._agent_configs[_current_agent_id].
    Appends messages to state.messages as the loop progresses.
    """
    agent_id = state.get("_current_agent_id")
    cfg = state.get("_agent_configs", {}).get(agent_id, {})

    system_prompt = cfg.get("system_prompt", "")
    model = cfg.get("model", "gemini-2.0-flash")
    tool_names = cfg.get("tools", [])
    max_iterations = cfg.get("max_iterations", 10)
    blocked_topics = cfg.get("guardrails", {}).get("blocked_topics", [])

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
        messages.append({
            "role": "assistant",
            "content": "I was unable to complete the request within the allowed steps. Please try a simpler query or increase max_iterations.",
        })

    return {"messages": messages}
