"""Provider-aware LLM router — dispatches model calls to the correct provider.

Looks up model names in the configured providers table to find the matching
provider's API key, base URL, and provider type, then routes to the correct
adapter (OpenAI-compatible, Gemini, Anthropic).

This replaces the old hardcoded Gemini-only client.
"""

import json
import logging
import re
import time
import uuid
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger(__name__)

# OpenAI-compatible providers use the same chat completions API format
OPENAI_COMPATIBLE = {"openai", "openrouter", "ollama", "custom"}

# Default pricing per 1M tokens (USD) — model -> (input_price, output_price)
MODEL_PRICING: dict[str, tuple[float, float]] = {
    "gemini-2.0-flash": (0.10, 0.40),
    "gemini-2.0-flash-lite": (0.075, 0.30),
    "gemini-2.0-pro": (0.50, 1.50),
    "gemini-1.5-flash": (0.075, 0.30),
    "gemini-1.5-pro": (0.50, 1.50),
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4.1": (2.00, 8.00),
    "gpt-4.1-mini": (0.40, 1.60),
    "gpt-4.1-nano": (0.10, 0.40),
    "gpt-3.5-turbo": (0.50, 1.50),
    "claude-3-opus": (15.00, 75.00),
    "claude-3-sonnet": (3.00, 15.00),
    "claude-3-haiku": (0.25, 1.25),
    "claude-3.5-sonnet": (3.00, 15.00),
    "claude-3.5-haiku": (0.80, 4.00),
    "claude-4-sonnet": (3.00, 15.00),
}


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculate estimated USD cost for a given model and token counts."""
    pricing = MODEL_PRICING.get(model)
    if not pricing:
        return 0.0
    input_price, output_price = pricing
    return (prompt_tokens / 1_000_000 * input_price) + (completion_tokens / 1_000_000 * output_price)


TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "input": {"type": "string", "description": "Input for the tool"}
    },
    "required": ["input"],
}


def _model_matches(model_name: str, provider_models: list[str]) -> bool:
    """Check if a model name matches any entry in a provider's model list.

    Handles prefix mismatches like 'anthropic/claude-opus-4.7-fast' vs
    'claude-opus-4.7-fast' by comparing just the name part after the last '/'.
    Also strips trailing version/date suffixes like '-20250514'.
    """
    if model_name in provider_models:
        return True
    short = model_name.split("/")[-1]
    if short in provider_models:
        return True
    # Try matching stored names that may have a prefix
    for m in provider_models:
        if m.split("/")[-1] == model_name:
            return True
        if m.split("/")[-1] == short:
            return True
    # Try stripping version suffixes (e.g. claude-opus-4-20250514 -> claude-opus-4)
    base = re.sub(r"-\d{8}$", "", short)
    if base != short:
        for m in provider_models:
            m_base = re.sub(r"-\d{8}$", "", m.split("/")[-1])
            if m_base == base:
                return True
    return False


async def _resolve_provider(model_name: str, db: AsyncSession | None, provider_id: str | None = None) -> dict[str, Any] | None:
    """Look up which provider owns a given model name.

    If provider_id is given, does a direct lookup by ID first; falls back to
    scanning all active providers if the direct lookup fails (handles stale IDs).
    If provider_id is not given, scans all active providers for a model match.
    Returns provider info dict with keys: provider_type, api_key, base_url
    Returns None if no matching provider found (caller should fall back to Gemini env key).
    """
    if db is None:
        if provider_id:
            logger.warning("No db session — creating temporary session for provider_id lookup of model '%s'", model_name)
            from app.db import engine
            async with AsyncSession(engine) as tmp_db:
                return await _resolve_provider(model_name, tmp_db, provider_id)
        logger.warning("No db session and no provider_id — cannot look up provider for model '%s'", model_name)
        return None
    try:
        from app.models.provider import LLMProvider
        from app.security import decrypt_value

        # Direct provider_id lookup (fast path)
        if provider_id:
            logger.warning("Direct provider_id lookup for model '%s': provider_id='%s'", model_name, provider_id)
            try:
                uid = uuid.UUID(provider_id)
            except (ValueError, AttributeError):
                logger.warning("Invalid provider_id '%s' for model '%s', falling back to scan", provider_id, model_name)
                uid = None
            if uid:
                result = await db.execute(
                    select(LLMProvider).where(
                        LLMProvider.id == uid,
                        LLMProvider.is_active == True,
                    )
                )
                p = result.scalar_one_or_none()
                if p:
                    api_key = decrypt_value(p.api_key) if p.api_key else ""
                    return {
                        "provider_type": p.provider_type,
                        "api_key": api_key,
                        "base_url": p.base_url.rstrip("/"),
                    }
                logger.warning("Provider %s not found by UUID — may have been deleted, falling back to scan", provider_id)

        # Scan all active providers for a model match
        result = await db.execute(
            select(LLMProvider).where(LLMProvider.is_active == True)
        )
        providers = result.scalars().all()
        logger.warning("Scanning %d active provider(s) for model '%s'", len(providers), model_name)
        for p in providers:
            p_models = p.models or []
            if _model_matches(model_name, p_models):
                api_key = decrypt_value(p.api_key) if p.api_key else ""
                logger.warning("Matched model '%s' to provider '%s' (type=%s)", model_name, p.name, p.provider_type)
                return {
                    "provider_type": p.provider_type,
                    "api_key": api_key,
                    "base_url": p.base_url.rstrip("/"),
                }
            logger.warning("Provider '%s' (type=%s) models=%s — no match for model '%s'", p.name, p.provider_type, p_models, model_name)
        logger.warning("No active provider matched model '%s' (checked %d active provider(s))", model_name, len(providers))
    except Exception as exc:
        logger.warning("Provider lookup failed for model %s: %s", model_name, exc)
    return None


# ── OpenAI-compatible adapter ─────────────────────────────────────────

async def _call_openai(
    model: str, system_prompt: str, messages: list[dict],
    tool_defs: list[dict], api_key: str, base_url: str,
) -> tuple[str, str | None, dict]:
    """Call an OpenAI-compatible chat completions API."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    body: dict[str, Any] = {
        "model": model,
        "messages": [],
        "max_tokens": 4096,
    }
    if system_prompt:
        body["messages"].append({"role": "system", "content": system_prompt})
    # Build messages with proper tool_call_id for tool role messages
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "tool":
            body["messages"].append({
                "role": "tool",
                "content": content,
                "tool_call_id": m.get("tool_call_id", f"call_{hash(content) % 10**8}"),
            })
        else:
            body["messages"].append({"role": role, "content": content})
    if tool_defs:
        body["tools"] = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": TOOL_SCHEMA,
                },
            }
            for t in tool_defs
        ]

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{base_url}/chat/completions", json=body, headers=headers)

    if resp.status_code == 429:
        return "Error: API rate limit exceeded. Please wait and try again.", None, {}
    if resp.status_code == 401:
        return "Error: API key invalid or unauthorized.", None, {}
    if resp.status_code != 200:
        return f"Error: API returned {resp.status_code} — {resp.text[:200]}", None, {}

    data = resp.json()
    choice = data.get("choices", [{}])[0]
    msg = choice.get("message", {})
    content = msg.get("content", "")
    tool_calls = msg.get("tool_calls", [])

    # Token usage
    usage = data.get("usage", {})
    usage_dict = {
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "completion_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
    }

    # Check for function call
    if tool_calls:
        fn = tool_calls[0].get("function", {})
        fn_name = fn.get("name", "")
        try:
            fn_input = json.loads(fn.get("arguments", "{}")).get("input", "")
        except (json.JSONDecodeError, TypeError):
            fn_input = fn.get("arguments", "")
        return fn_name, fn_input, usage_dict

    return content or "", None, usage_dict


# ── Gemini adapter ─────────────────────────────────────────────────────

async def _call_gemini(
    model: str, system_prompt: str, messages: list[dict],
    tool_defs: list[dict], api_key: str, base_url: str,
) -> tuple[str, str | None, dict]:
    """Call Google Gemini REST API."""
    url = f"{base_url}/models/{model}:generateContent"
    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": f"[System Instruction]\n{system_prompt}"}]})
    for m in messages:
        role = "model" if m.get("role") == "assistant" else m.get("role", "user")
        contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

    body: dict[str, Any] = {"contents": contents}
    if tool_defs:
        body["tools"] = [
            {"functionDeclarations": [
                {"name": t["name"], "description": t.get("description", ""), "parameters": TOOL_SCHEMA}
            ]}
            for t in tool_defs
        ]

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            url, json=body,
            headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        )

    if resp.status_code == 429:
        return "Error: API rate limit exceeded. Please wait and try again.", None, {}
    if resp.status_code == 403:
        return "Error: API key invalid or unauthorized.", None, {}
    if resp.status_code != 200:
        return f"Error: API returned {resp.status_code} — {resp.text[:200]}", None, {}

    try:
        data = resp.json()
    except json.JSONDecodeError:
        return "Error: Invalid API response", None, {}

    usage = data.get("usageMetadata", {})
    usage_dict = {
        "prompt_tokens": usage.get("promptTokenCount", 0),
        "completion_tokens": usage.get("candidatesTokenCount", 0),
        "total_tokens": usage.get("totalTokenCount", 0),
    }
    candidates = data.get("candidates", [])
    if not candidates:
        return data.get("text", ""), None, usage_dict

    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "functionCall" in part:
            fn = part["functionCall"]
            return fn.get("name", ""), fn.get("args", {}).get("input", ""), usage_dict
        if "text" in part:
            return part["text"], None, usage_dict

    # No usable content found in parts — return meaningful fallback
    return "I received no usable response content. Please check your input and try again.", None, usage_dict


# ── Anthropic adapter ──────────────────────────────────────────────────

async def _call_anthropic(
    model: str, system_prompt: str, messages: list[dict],
    tool_defs: list[dict], api_key: str, base_url: str,
) -> tuple[str, str | None, dict]:
    """Call Anthropic Claude API (messages format)."""
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }
    body: dict[str, Any] = {
        "model": model,
        "max_tokens": 4096,
        "messages": [],
    }
    if system_prompt:
        body["system"] = system_prompt
    # Build messages with proper content blocks for tool results (Anthropic format)
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "tool":
            body["messages"].append({
                "role": "user",
                "content": [{"type": "tool_result", "content": content}],
            })
        elif role == "assistant" and m.get("tool_calls"):
            # Assistant message with tool calls
            content_blocks = [{"type": "text", "text": content}] if content else []
            for tc in m.get("tool_calls", []):
                fn = tc.get("function", {})
                content_blocks.append({
                    "type": "tool_use",
                    "id": tc.get("id", "toolu_1"),
                    "name": fn.get("name", ""),
                    "input": fn.get("arguments", "{}"),
                })
            body["messages"].append({"role": "assistant", "content": content_blocks})
        else:
            body["messages"].append({"role": role, "content": content})
    if tool_defs:
        body["tools"] = [
            {"name": t["name"], "description": t.get("description", ""), "input_schema": TOOL_SCHEMA}
            for t in tool_defs
        ]

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{base_url}/messages", json=body, headers=headers)

    if resp.status_code == 429:
        return "Error: API rate limit exceeded. Please wait and try again.", None, {}
    if resp.status_code == 401:
        return "Error: API key invalid or unauthorized.", None, {}
    if resp.status_code != 200:
        return f"Error: API returned {resp.status_code} — {resp.text[:200]}", None, {}

    data = resp.json()
    content_blocks = data.get("content", [])
    usage = data.get("usage", {})
    usage_dict = {
        "prompt_tokens": usage.get("input_tokens", 0),
        "completion_tokens": usage.get("output_tokens", 0),
        "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
    }

    for block in content_blocks:
        if block.get("type") == "tool_use":
            fn_input = block.get("input", {})
            return block.get("name", ""), json.dumps(fn_input) if isinstance(fn_input, dict) else str(fn_input), usage_dict
        if block.get("type") == "text":
            return block.get("text", ""), None, usage_dict

    return "", None, usage_dict


# ── Public API: maintained to match legacy call_llm_with_tools signature ──

async def call_llm_with_tools(
    model_name: str,
    system_prompt: str,
    messages: list[dict],
    tool_defs: list[dict],
    db: AsyncSession | None = None,
    provider_id: str | None = None,
) -> tuple[str, str | None, dict]:
    """Call an LLM with optional tool support, routing to the correct provider.

    1. First, tries direct provider lookup by provider_id if given.
    2. Falls back to scanning all active providers for a matching model name.
    3. Falls back to the old Gemini env-key behavior if no provider found.

    Returns (response_text, tool_name_or_None, usage_dict).
    """
    start = time.monotonic()
    provider = await _resolve_provider(model_name, db, provider_id)

    if provider:
        ptype = provider["provider_type"]
        api_key = provider["api_key"]
        base_url = provider["base_url"]
        if not api_key:
            return f"Error: No API key configured for provider serving model '{model_name}'", None, {}

        logger.debug("Routing model '%s' to provider type '%s'", model_name, ptype)

        try:
            if ptype in OPENAI_COMPATIBLE:
                result = await _call_openai(model_name, system_prompt, messages, tool_defs, api_key, base_url)
            elif ptype == "gemini":
                result = await _call_gemini(model_name, system_prompt, messages, tool_defs, api_key, base_url)
            elif ptype == "anthropic":
                result = await _call_anthropic(model_name, system_prompt, messages, tool_defs, api_key, base_url)
            else:
                logger.warning("Unknown provider type '%s', trying OpenAI-compatible fallback", ptype)
                result = await _call_openai(model_name, system_prompt, messages, tool_defs, api_key, base_url)
        except Exception as exc:
            elapsed_ms = int((time.monotonic() - start) * 1000)
            logger.error("LLM call failed", extra={
                "model": model_name, "provider_type": ptype,
                "duration_ms": elapsed_ms, "error": str(exc),
            })
            raise

        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.info("LLM call completed", extra={
            "model": model_name, "provider_type": ptype,
            "duration_ms": elapsed_ms,
            "prompt_tokens": result[2].get("prompt_tokens", 0),
            "completion_tokens": result[2].get("completion_tokens", 0),
            "total_tokens": result[2].get("total_tokens", 0),
            "tool_call": bool(result[1]),
        })
        return result

    # Fallback: use GEMINI_API_KEY env var for known Gemini models
    if settings.gemini_api_key:
        gemini_base = "https://generativelanguage.googleapis.com/v1beta"
        logger.info("No provider found for model '%s', falling back to GEMINI_API_KEY", model_name)
        result = await _call_gemini(model_name, system_prompt, messages, tool_defs, settings.gemini_api_key, gemini_base)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.info("LLM call completed (fallback)", extra={
            "model": model_name, "provider_type": "gemini",
            "duration_ms": elapsed_ms,
            "prompt_tokens": result[2].get("prompt_tokens", 0),
            "completion_tokens": result[2].get("completion_tokens", 0),
        })
        return result

    elapsed_ms = int((time.monotonic() - start) * 1000)
    logger.warning("No provider found for model '%s' and no GEMINI_API_KEY fallback", model_name, extra={"model": model_name, "duration_ms": elapsed_ms})
    return f"Error: No provider configured for model '{model_name}'. Please add a provider or set GEMINI_API_KEY.", None, {}
