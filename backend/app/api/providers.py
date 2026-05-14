"""LLM provider management — register API keys, test connections, list available models."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas import ProviderCreate, ProviderResponse, ProviderTest, ProviderTestResponse, DeleteResponse
from app.services import provider_service

PRESETS: dict[str, dict] = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "name": "OpenAI",
        "key_hint": "sk-...",
        "key_example": "sk-proj-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "name": "Google Gemini",
        "key_hint": "AIza...",
        "key_example": "AIzaSyCb8mN3pQ7rX5vB1wJ4cL6nM0zS8tD9fG2hK",
    },
    "anthropic": {
        "base_url": "https://api.anthropic.com/v1",
        "name": "Anthropic",
        "key_hint": "sk-ant-...",
        "key_example": "sk-ant-auth03aF8kD9mN2pQ7rX5vB1wJ4cL6nM",
    },
    "ollama": {
        "base_url": "http://localhost:11434/v1",
        "name": "Ollama (Local)",
        "key_hint": "No key needed",
        "key_example": "",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "name": "OpenRouter",
        "key_hint": "sk-or-...",
        "key_example": "sk-or-v1-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t",
    },
}

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("", response_model=list[ProviderResponse])
async def list_providers(db: AsyncSession = Depends(get_db)):
    """List all configured LLM providers. No input required.

    API keys are masked in responses — only first 4 and last 4 characters shown.
    """
    return await provider_service.list_providers(db)


@router.post("", status_code=201, response_model=ProviderResponse,
    responses={400: {"description": "Validation error"}})
async def create_provider(body: ProviderCreate, db: AsyncSession = Depends(get_db)):
    """Register a new LLM provider.

    The API key is encrypted at rest using Fernet (PBKDF2-SHA256).
    Use POST /providers/test to discover available models before creating.
    """
    provider_type = body.provider_type
    preset = PRESETS.get(provider_type, {})
    base_url = body.base_url or preset.get("base_url", "")
    data = body.model_dump()
    data["base_url"] = base_url
    return await provider_service.create_provider(db, data)


@router.patch("/{provider_id}", response_model=dict,
    responses={404: {"description": "Provider not found"}})
async def update_provider(provider_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    """Update provider config (name, base_url, api_key, models, is_active)."""
    result = await provider_service.update_provider(db, provider_id, body)
    if not result:
        raise HTTPException(404, "Provider not found")
    return result


@router.delete("/{provider_id}", response_model=DeleteResponse,
    responses={404: {"description": "Provider not found"}})
async def delete_provider(provider_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a provider configuration. Encrypted key is permanently deleted."""
    deleted = await provider_service.delete_provider(db, provider_id)
    if not deleted:
        raise HTTPException(404, "Provider not found")
    return {"ok": True}


@router.get("/models", response_model=list[dict])
async def list_available_models(db: AsyncSession = Depends(get_db)):
    """Get all models from all active providers. No input required.

    Returns model name, provider name, provider type, and provider UUID.
    Only providers with is_active=True are included.
    """
    from sqlalchemy import select
    from app.models.provider import LLMProvider
    result = await db.execute(select(LLMProvider).where(LLMProvider.is_active == True))
    providers = result.scalars().all()
    models = []
    for p in providers:
        for m in (p.models or []):
            models.append({"model": m, "provider_name": p.name, "provider_type": p.provider_type, "provider_id": str(p.id)})
    return models


@router.post("/test", response_model=ProviderTestResponse,
    responses={400: {"description": "Connection failed"}})
async def test_connection(body: ProviderTest):
    """Test a provider connection by making a lightweight API call.

    Returns available models on success. Supports:
    - OpenAI: calls GET /models with Bearer token
    - Gemini: calls GET /models with X-goog-api-key header
    - Anthropic: calls GET /models with x-api-key header
    - Ollama: calls GET /tags (no auth needed)
    - Custom: attempts Bearer token auth
    """
    import httpx
    base_url = body.base_url.rstrip("/")
    api_key = body.api_key
    provider_type = body.provider_type

    if not base_url:
        raise HTTPException(400, "Base URL is required")
    if not api_key and provider_type not in ("ollama", "custom"):
        raise HTTPException(400, "API key is required for this provider type")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            headers = {}
            if provider_type == "openai":
                headers["Authorization"] = f"Bearer {api_key}"
                resp = await client.get(f"{base_url}/models", headers=headers)
                resp.raise_for_status()
                models = [m["id"] for m in resp.json().get("data", [])[:10]]
            elif provider_type == "gemini":
                headers["X-goog-api-key"] = api_key
                resp = await client.get(f"{base_url}/models", headers=headers)
                resp.raise_for_status()
                models = [m["name"].split("/")[-1] for m in resp.json().get("models", [])[:10]]
            elif provider_type == "anthropic":
                headers["x-api-key"] = api_key
                headers["anthropic-version"] = "2023-06-01"
                resp = await client.get(f"{base_url}/models", headers=headers)
                resp.raise_for_status()
                models = [m["id"] for m in resp.json().get("data", [])[:10]]
            elif provider_type == "ollama":
                resp = await client.get(f"{base_url}/tags")
                resp.raise_for_status()
                models = [m["name"] for m in resp.json().get("models", [])[:10]]
            else:
                if api_key:
                    headers["Authorization"] = f"Bearer {api_key}"
                resp = await client.get(f"{base_url}/models", headers=headers)
                data = resp.json()
                raw = data.get("data") or data.get("models") or []
                models = [m.get("id") or m.get("name", "") for m in raw[:10]]
            return {"ok": True, "models": models}
    except httpx.HTTPStatusError as e:
        detail = f"HTTP {e.response.status_code}"
        try:
            detail += f": {e.response.json().get('error', {}).get('message', '')}"
        except Exception:
            detail += f": {e.response.text[:200]}"
        raise HTTPException(400, f"Connection failed: {detail}")
    except httpx.RequestError as e:
        raise HTTPException(400, f"Connection failed: {e}")


@router.get("/presets", response_model=list[dict])
async def list_presets():
    """List available provider presets with suggested names, URLs, and key format hints.

    No input required. Presets are: OpenAI, Google Gemini, Anthropic, Ollama, OpenRouter.
    """
    return [
        {"type": k, "label": v.get("name", k.title()), "base_url": v["base_url"],
         "key_hint": v.get("key_hint", ""), "key_example": v.get("key_example", "")}
        for k, v in PRESETS.items()
    ]
