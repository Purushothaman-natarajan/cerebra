"""Agent execution node for LangGraph with optional conversation memory
and event publishing for live logs."""

from datetime import datetime, timezone

from app.bus import publish
from app.runtime.llm import call_llm_with_tools, estimate_cost
from app.runtime.memory import get_history, add_messages
from app.runtime.tools.registry import get_tool, get_tool_definitions


async def agent_node(state: dict) -> dict:
    """Execute an agent node: LLM call + optional tool execution loop.

    Reads agent config from state._agent_configs[_current_agent_id].
    Appends messages to state.messages as the loop progresses.
    Accumulates token usage and cost in state._usage.
    If memory_enabled, loads prior conversation history and saves on completion.
    Publishes tool_call and message events to the bus for live logs.
    """
    agent_id = state.get("_current_agent_id")
    run_id = state.get("run_id", "")
    cfg = state.get("_agent_configs", {}).get(agent_id, {})

    system_prompt = cfg.get("system_prompt", "")
    model = cfg.get("model", "gemini-2.0-flash")
    tool_names = cfg.get("tools", [])
    max_iterations = cfg.get("max_iterations", 10)
    blocked_topics = cfg.get("guardrails", {}).get("blocked_topics", [])
    memory_enabled = cfg.get("memory_enabled", False)

    messages = state.get("messages", [])

    # Prepend conversation history if memory is enabled
    if memory_enabled and agent_id:
        history = get_history(agent_id)
        if history:
            messages = history + messages

    tool_defs = [t for t in get_tool_definitions() if t["name"] in tool_names]
    usage = state.get("_usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost": 0.0})

    iteration = 0
    while iteration < max_iterations:
        iteration += 1
        result, tool_call, call_usage = await call_llm_with_tools(model, system_prompt, messages, tool_defs)

        if call_usage:
            usage["prompt_tokens"] += call_usage.get("prompt_tokens", 0)
            usage["completion_tokens"] += call_usage.get("completion_tokens", 0)
            usage["total_tokens"] += call_usage.get("total_tokens", 0)
            usage["cost"] += estimate_cost(
                model,
                call_usage.get("prompt_tokens", 0),
                call_usage.get("completion_tokens", 0),
            )

        if tool_call:
            fn = get_tool(tool_call)
            if fn:
                # Publish tool_call event
                if run_id:
                    await publish(f"run:events:{run_id}", {
                        "run_id": run_id,
                        "type": "tool_call",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "agent_id": agent_id,
                        "payload": {"tool": tool_call, "input": call_usage.get("input", result)},
                    })
                tool_result = await fn(result)
                messages.append({"role": "tool", "content": tool_result, "name": tool_call})
                # Publish tool result as message event
                if run_id:
                    await publish(f"run:events:{run_id}", {
                        "run_id": run_id,
                        "type": "message",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "agent_id": agent_id,
                        "payload": {"tool": tool_call, "result": tool_result[:500]},
                    })
        else:
            for topic in blocked_topics:
                if topic.lower() in result.lower():
                    result = f"Blocked response (contains topic: {topic})"
                    break

            if run_id:
                await publish(f"run:events:{run_id}", {
                    "run_id": run_id,
                    "type": "message",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "agent_id": agent_id,
                    "payload": {"content": result[:500]},
                })
            messages.append({"role": "assistant", "content": result})
            break
    else:
        messages.append({
            "role": "assistant",
            "content": "I was unable to complete the request within the allowed steps. Please try a simpler query or increase max_iterations.",
        })

    # Save conversation to memory if enabled
    if memory_enabled and agent_id:
        add_messages(agent_id, messages[-4:])  # keep last exchange

    return {"messages": messages, "_usage": usage}
