"""Gemini LLM client — direct async httpx calls to Gemini REST API.

The google-genai SDK doesn't support system_instruction or tools in
generate_content(). We bypass the SDK entirely and call the REST API directly.
"""

import json
from functools import cache

import httpx

from app.config import settings

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "input": {"type": "string", "description": "Input for the tool"}
    },
    "required": ["input"],
}


@cache
def get_api_key() -> str:
    return settings.gemini_api_key or ""


def _build_request(model: str, system_prompt: str, messages: list[dict], tool_defs: list[dict]) -> dict:
    """Build the Gemini API request body."""
    contents = []
    # Prepend system instruction as a user message for models that support it
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": f"[System Instruction]\n{system_prompt}"}]})

    for m in messages:
        role = "model" if m.get("role") == "assistant" else m.get("role", "user")
        contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

    body: dict = {"contents": contents}

    # Add tools if defined
    if tool_defs:
        body["tools"] = [
            {"functionDeclarations": [
                {"name": t["name"], "description": t.get("description", ""),
                 "parameters": TOOL_SCHEMA}
            ]}
            for t in tool_defs
        ]

    return body


def _parse_response(response_data: dict) -> tuple[str, str | None]:
    """Parse Gemini API response. Returns (text, function_name_or_None)."""
    candidates = response_data.get("candidates", [])
    if not candidates:
        return response_data.get("text", ""), None

    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "functionCall" in part:
            fn = part["functionCall"]
            args = fn.get("args", {})
            return fn.get("name", ""), args.get("input", "")
        if "text" in part:
            return part["text"], None

    return "", None


async def call_llm_with_tools(
    model_name: str,
    system_prompt: str,
    messages: list[dict],
    tool_defs: list[dict],
) -> tuple[str, str | None]:
    """Call Gemini LLM with optional tool calling via direct REST API.

    Returns (response_text, tool_name_or_None).
    tool_name is returned when the model wants to call a function.
    """
    api_key = get_api_key()
    if not api_key:
        return "Error: GEMINI_API_KEY not configured", None

    url = f"{GEMINI_BASE}/models/{model_name}:generateContent"
    body = _build_request(model_name, system_prompt, messages, tool_defs)

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            url,
            json=body,
            headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        )

    if resp.status_code == 429:
        return "Error: API rate limit exceeded. Please wait and try again.", None
    if resp.status_code == 403:
        return "Error: API key invalid or unauthorized.", None
    if resp.status_code != 200:
        detail = resp.text[:200]
        return f"Error: API returned {resp.status_code} — {detail}", None

    try:
        data = resp.json()
    except json.JSONDecodeError:
        return "Error: Invalid API response", None

    return _parse_response(data)
