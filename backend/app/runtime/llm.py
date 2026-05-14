"""Gemini LLM client wrapper. Uses google-genai SDK sync client.

Note: This SDK version's generate_content does not accept system_instruction
or tools parameters. System prompt is prepended to messages.
Returns (text_response, tool_call_name).
"""

from functools import cache

from google import genai

from app.config import settings


@cache
def get_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key or "")


async def call_llm_with_tools(
    model_name: str,
    system_prompt: str,
    messages: list[dict],
    tool_defs: list[dict],
) -> tuple[str, str | None]:
    client = get_client()
    contents = _build_contents(messages, system_prompt)
    response = client.models.generate_content(model=model_name, contents=contents)
    if response.candidates:
        parts = response.candidates[0].content.parts
        for part in parts:
            if hasattr(part, "function_call") and part.function_call:
                fn = part.function_call
                args = dict(fn.args.items())
                return fn.name, args.get("input", "")
    return response.text, None


def _build_contents(messages: list[dict], system_prompt: str = "") -> list[dict]:
    result = []
    if system_prompt:
        result.append({"role": "user", "parts": [{"text": f"[System]\n{system_prompt}"}]})
    for m in messages:
        result.append({"role": m.get("role", "user"), "parts": [{"text": m.get("content", "")}]})
    return result
