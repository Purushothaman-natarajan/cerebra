from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
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


@router.get("")
async def list_providers(db: AsyncSession = Depends(get_db)):
    return await provider_service.list_providers(db)


@router.post("", status_code=201)
async def create_provider(body: dict, db: AsyncSession = Depends(get_db)):
    provider_type = body.get("provider_type", "custom")
    preset = PRESETS.get(provider_type, {})
    if not body.get("base_url"):
        body["base_url"] = preset.get("base_url", "")
    return await provider_service.create_provider(db, body)


@router.patch("/{provider_id}")
async def update_provider(provider_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    result = await provider_service.update_provider(db, provider_id, body)
    if not result:
        raise HTTPException(404, "Provider not found")
    return result


@router.delete("/{provider_id}")
async def delete_provider(provider_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await provider_service.delete_provider(db, provider_id)
    if not deleted:
        raise HTTPException(404, "Provider not found")
    return {"ok": True}


@router.get("/models")
async def list_available_models(db: AsyncSession = Depends(get_db)):
    """Get all available models from all active providers."""
    from sqlalchemy import select
    from app.models.provider import LLMProvider
    result = await db.execute(select(LLMProvider).where(LLMProvider.is_active == True))
    providers = result.scalars().all()
    models = []
    for p in providers:
        for m in (p.models or []):
            models.append({"model": m, "provider_name": p.name, "provider_type": p.provider_type, "provider_id": str(p.id)})
    return models


@router.post("/test")
async def test_connection(body: dict):
    """Test a provider connection. Returns available models on success."""
    import httpx
    base_url = body.get("base_url", "").rstrip("/")
    api_key = body.get("api_key", "")
    provider_type = body.get("provider_type", "custom")

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
                # Gemini uses X-goog-api-key header (not Authorization Bearer)
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


@router.get("/presets")
async def list_presets():
    return [
        {
            "type": k,
            "label": v.get("name", k.title()),
            "base_url": v["base_url"],
            "key_hint": v.get("key_hint", ""),
            "key_example": v.get("key_example", ""),
        }
        for k, v in PRESETS.items()
    ]
