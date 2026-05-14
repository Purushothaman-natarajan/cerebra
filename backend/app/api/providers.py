"""LLM provider management — register API keys, test connections, list available models."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.docs import list_response_example, response_example
from app.schemas import (
    DeleteResponse, ProviderCreate, ProviderModelResponse, ProviderPresetResponse,
    ProviderResponse, ProviderTest, ProviderTestResponse, ProviderUpdate,
)
from app.services import provider_service

PRESETS: dict[str, dict] = {
    "openai": {"base_url": "https://api.openai.com/v1", "name": "OpenAI",
               "key_hint": "sk-...", "key_example": "sk-proj-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t"},
    "gemini": {"base_url": "https://generativelanguage.googleapis.com/v1beta", "name": "Google Gemini",
               "key_hint": "AIza...", "key_example": "AIzaSyCb8mN3pQ7rX5vB1wJ4cL6nM0zS8tD9fG2hK"},
    "anthropic": {"base_url": "https://api.anthropic.com/v1", "name": "Anthropic",
                  "key_hint": "sk-ant-...", "key_example": "sk-ant-auth03aF8kD9mN2pQ7rX5vB1wJ4cL6nM"},
    "ollama": {"base_url": "http://localhost:11434/v1", "name": "Ollama (Local)",
               "key_hint": "No key needed", "key_example": ""},
    "openrouter": {"base_url": "https://openrouter.ai/api/v1", "name": "OpenRouter",
                   "key_hint": "sk-or-...", "key_example": "sk-or-v1-3aF8kD9mN2pQ7rX5vB1wJ4cL6nM0zS8t"},
}

router = APIRouter(prefix="/providers", tags=["providers"])

_PROVIDER_EXAMPLE = {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "My OpenAI", "provider_type": "openai",
    "base_url": "https://api.openai.com/v1",
    "models": ["gpt-4o", "gpt-4o-mini"],
    "is_active": True, "api_key": "sk-p...S8t",
    "created_at": "2026-05-13T12:00:00+00:00",
}
_MODEL_EXAMPLE = {"model": "gpt-4o", "provider_name": "My OpenAI", "provider_type": "openai", "provider_id": "550e8400-..."}
_PRESET_EXAMPLE = {"type": "openai", "label": "OpenAI", "base_url": "https://api.openai.com/v1", "key_hint": "sk-...", "key_example": "sk-proj-..."}


@router.get("", response_model=list[ProviderResponse],
    responses=list_response_example([_PROVIDER_EXAMPLE]))
async def list_providers(db: AsyncSession = Depends(get_db)):
    """List all configured LLM providers. No input required. API keys are masked."""
    return await provider_service.list_providers(db)


@router.post("", status_code=201, response_model=ProviderResponse,
    responses=response_example(_PROVIDER_EXAMPLE))
async def create_provider(body: ProviderCreate, db: AsyncSession = Depends(get_db)):
    """Register a new LLM provider. API key is encrypted at rest."""
    provider_type = body.provider_type
    preset = PRESETS.get(provider_type, {})
    base_url = body.base_url or preset.get("base_url", "")
    data = body.model_dump()
    data["base_url"] = base_url
    return await provider_service.create_provider(db, data)


@router.patch("/{provider_id}", response_model=dict,
    responses={**response_example({"id": "...", "name": "My OpenAI", "is_active": True}),
               **{404: {"description": "Provider not found"}}})
async def update_provider(provider_id: str, body: ProviderUpdate, db: AsyncSession = Depends(get_db)):
    """Update provider config. Only provided fields are changed. API key is re-encrypted."""
    result = await provider_service.update_provider(db, provider_id, body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(404, "Provider not found")
    return result


@router.delete("/{provider_id}", response_model=DeleteResponse,
    responses={**response_example({"ok": True}), **{404: {"description": "Provider not found"}}})
async def delete_provider(provider_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a provider. Encrypted key is permanently deleted."""
    deleted = await provider_service.delete_provider(db, provider_id)
    if not deleted:
        raise HTTPException(404, "Provider not found")
    return {"ok": True}


@router.get("/models", response_model=list[ProviderModelResponse],
    responses=list_response_example([_MODEL_EXAMPLE]))
async def list_available_models(db: AsyncSession = Depends(get_db)):
    """Get all models from all active providers. No input required."""
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
    responses={**response_example({"ok": True, "models": ["gemini-2.0-flash", "gemini-2.0-pro"]}),
               **{400: {"description": "Connection failed"}}})
async def test_connection(body: ProviderTest):
    """Test a provider connection by making a lightweight API call to list models."""
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


@router.get("/presets", response_model=list[ProviderPresetResponse],
    responses=list_response_example([_PRESET_EXAMPLE]))
async def list_presets():
    """List available provider presets with key format hints. No input required."""
    return [
        {"type": k, "label": v.get("name", k.title()), "base_url": v["base_url"],
         "key_hint": v.get("key_hint", ""), "key_example": v.get("key_example", "")}
        for k, v in PRESETS.items()
    ]


@router.post("/clear-keys", response_model=DeleteResponse)
async def clear_all_provider_keys(db: AsyncSession = Depends(get_db)):
    """Clear all provider API keys. Keys are permanently removed (set to empty string)."""
    count = await provider_service.clear_all_keys(db)
    return {"ok": True}
