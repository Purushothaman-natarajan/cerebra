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

# Default pricing per 1M tokens (USD) — model -> (input_price, output_price)
MODEL_PRICING: dict[str, tuple[float, float]] = {
    "gemini-2.0-flash": (0.10, 0.40),
    "gemini-2.0-flash-lite": (0.075, 0.30),
    "gemini-2.0-pro": (0.50, 1.50),
    "gemini-1.5-flash": (0.075, 0.30),
    "gemini-1.5-pro": (0.50, 1.50),
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-3.5-turbo": (0.50, 1.50),
    "claude-3-opus": (15.00, 75.00),
    "claude-3-sonnet": (3.00, 15.00),
    "claude-3-haiku": (0.25, 1.25),
}


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculate estimated USD cost for a given model and token counts."""
    pricing = MODEL_PRICING.get(model)
    if not pricing:
        return 0.0
    input_price, output_price = pricing
    return (prompt_tokens / 1_000_000 * input_price) + (completion_tokens / 1_000_000 * output_price)


@cache
def get_api_key() -> str:
    return settings.gemini_api_key or ""


def _build_request(model: str, system_prompt: str, messages: list[dict], tool_defs: list[dict]) -> dict:
    """Build the Gemini API request body."""
    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": f"[System Instruction]\n{system_prompt}"}]})

    for m in messages:
        role = "model" if m.get("role") == "assistant" else m.get("role", "user")
        contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

    body: dict = {"contents": contents}

    if tool_defs:
        body["tools"] = [
            {"functionDeclarations": [
                {"name": t["name"], "description": t.get("description", ""),
                 "parameters": TOOL_SCHEMA}
            ]}
            for t in tool_defs
        ]

    return body


def _parse_usage(response_data: dict) -> dict:
    """Extract token usage from Gemini response metadata."""
    meta = response_data.get("usageMetadata", {})
    return {
        "prompt_tokens": meta.get("promptTokenCount", 0),
        "completion_tokens": meta.get("candidatesTokenCount", 0),
        "total_tokens": meta.get("totalTokenCount", 0),
    }


def _parse_response(response_data: dict) -> tuple[str, str | None, dict]:
    """Parse Gemini API response. Returns (text, function_name_or_None, usage)."""
    usage = _parse_usage(response_data)
    candidates = response_data.get("candidates", [])
    if not candidates:
        return response_data.get("text", ""), None, usage

    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "functionCall" in part:
            fn = part["functionCall"]
            args = fn.get("args", {})
            return fn.get("name", ""), args.get("input", ""), usage
        if "text" in part:
            return part["text"], None, usage

    return "", None, usage


async def call_llm_with_tools(
    model_name: str,
    system_prompt: str,
    messages: list[dict],
    tool_defs: list[dict],
) -> tuple[str, str | None, dict]:
    """Call Gemini LLM with optional tool calling via direct REST API.

    Returns (response_text, tool_name_or_None, usage_dict).
    tool_name is returned when the model wants to call a function.
    usage_dict contains prompt_tokens, completion_tokens, total_tokens.
    """
    api_key = get_api_key()
    if not api_key:
        return "Error: GEMINI_API_KEY not configured", None, {}

    url = f"{GEMINI_BASE}/models/{model_name}:generateContent"
    body = _build_request(model_name, system_prompt, messages, tool_defs)

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            url,
            json=body,
            headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        )

    if resp.status_code == 429:
        return "Error: API rate limit exceeded. Please wait and try again.", None, {}
    if resp.status_code == 403:
        return "Error: API key invalid or unauthorized.", None, {}
    if resp.status_code != 200:
        detail = resp.text[:200]
        return f"Error: API returned {resp.status_code} — {detail}", None, {}

    try:
        data = resp.json()
    except json.JSONDecodeError:
        return "Error: Invalid API response", None, {}

    return _parse_response(data)
