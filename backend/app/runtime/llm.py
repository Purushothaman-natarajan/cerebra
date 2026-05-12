from functools import lru_cache

from google import genai

from app.config import settings


@lru_cache
def get_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key or "")


async def call_llm_with_tools(
    model_name: str,
    system_prompt: str,
    messages: list[dict],
    tool_defs: list[dict],
) -> tuple[str, str | None]:
    client = get_client()
    contents = _build_contents(messages)

    tools = None
    if tool_defs:
        tools = [
            {"function_declarations": [
                {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": {
                        "type": "object",
                        "properties": {"input": {"type": "string"}},
                    },
                }
            ]}
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
                args = {k: v for k, v in fn.args.items()}
                input_val = args.get("input", "")
                return fn.name, input_val

    return response.text, None


def _build_contents(messages: list[dict]) -> list[dict]:
    return [{"role": m.get("role", "user"), "parts": [{"text": m.get("content", "")}]} for m in messages]
