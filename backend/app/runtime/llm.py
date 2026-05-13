"""Gemini LLM client wrapper.

Uses the google-genai SDK with async support via client.aio.
System prompt, message history, and tool definitions are passed to the model.
Returns (text_response, tool_call_name) — one of which is None.
"""

from functools import cache

from google import genai

from app.config import settings


@cache
def get_client() -> genai.Client:
    """Lazy-init Gemini client. Cached to avoid re-authentication."""
    return genai.Client(api_key=settings.gemini_api_key or "")


async def call_llm_with_tools(
    model_name: str,
    system_prompt: str,
    messages: list[dict],
    tool_defs: list[dict],
) -> tuple[str, str | None]:
    """Call the Gemini LLM with optional tool calling.

    Args:
        model_name: Gemini model name (e.g., "gemini-2.0-flash").
        system_prompt: System instruction for the model.
        messages: Conversation history.
        tool_defs: Tool definitions for function calling.

    Returns:
        Tuple of (response_text, tool_name_or_None).
    """
    client = get_client()
    contents = _build_contents(messages)

    tools = None
    if tool_defs:
        tools = [
            {"function_declarations": [{
                "name": t["name"], "description": t.get("description", ""),
                "parameters": {"type": "object", "properties": {"input": {"type": "string"}}},
            }]}
            for t in tool_defs
        ]

    kwargs = {"model": model_name, "contents": contents}
    if system_prompt:
        kwargs["system_instruction"] = system_prompt
    if tools:
        kwargs["tools"] = tools

    response = await client.aio.models.generate_content(**kwargs)

    if response.candidates:
        parts = response.candidates[0].content.parts
        for part in parts:
            if hasattr(part, "function_call") and part.function_call:
                fn = part.function_call
                args = dict(fn.args.items())
                return fn.name, args.get("input", "")

    return response.text, None


def _build_contents(messages: list[dict]) -> list[dict]:
    """Convert internal message format to Gemini API content format."""
    return [{"role": m.get("role", "user"), "parts": [{"text": m.get("content", "")}]} for m in messages]
