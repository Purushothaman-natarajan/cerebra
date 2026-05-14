"""Conversation memory — stores and retrieves message history for agents with memory_enabled.

Uses an in-memory dict keyed by agent_id. Each agent has a rolling window
of the last N conversations (default 10).
"""

from collections import defaultdict

# agent_id -> list of message dicts (rolling window)
_conversation_store: dict[str, list[dict]] = defaultdict(list)
_MAX_HISTORY = 10


def get_history(agent_id: str) -> list[dict]:
    """Get conversation history for an agent."""
    return list(_conversation_store.get(agent_id, []))


def add_messages(agent_id: str, messages: list[dict]):
    """Append new messages to an agent's conversation history."""
    store = _conversation_store[agent_id]
    store.extend(messages)
    # Keep only the last N exchanges
    if len(store) > _MAX_HISTORY * 2:
        _conversation_store[agent_id] = store[-_MAX_HISTORY * 2:]


def clear_history(agent_id: str):
    """Clear conversation history for an agent."""
    _conversation_store.pop(agent_id, None)
