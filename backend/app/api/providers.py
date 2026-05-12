import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.provider import LLMProvider

PRESETS: dict[str, dict] = {
    "openai": {"base_url": "https://api.openai.com/v1"},
    "gemini": {"base_url": "https://generativelanguage.googleapis.com/v1beta"},
    "anthropic": {"base_url": "https://api.anthropic.com/v1"},
    "ollama": {"base_url": "http://localhost:11434/v1"},
    "openrouter": {"base_url": "https://openrouter.ai/api/v1"},
}

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("")
async def list_providers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMProvider).order_by(LLMProvider.created_at.desc()))
    providers = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "provider_type": p.provider_type,
            "base_url": p.base_url,
            "models": p.models,
            "is_active": p.is_active,
            "created_at": p.created_at.isoformat(),
        }
        for p in providers
    ]


@router.post("", status_code=201)
async def create_provider(body: dict, db: AsyncSession = Depends(get_db)):
    provider_type = body.get("provider_type", "custom")
    preset = PRESETS.get(provider_type, {})
    base_url = body.get("base_url") or preset.get("base_url", "")

    provider = LLMProvider(
        name=body["name"],
        provider_type=provider_type,
        base_url=base_url,
        api_key=body.get("api_key", ""),
        models=body.get("models", []),
        is_active=body.get("is_active", True),
    )
    db.add(provider)
    await db.flush()

    return {
        "id": str(provider.id),
        "name": provider.name,
        "provider_type": provider.provider_type,
        "base_url": provider.base_url,
        "models": provider.models,
        "is_active": provider.is_active,
        "created_at": provider.created_at.isoformat(),
    }


@router.patch("/{provider_id}")
async def update_provider(provider_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMProvider).where(LLMProvider.id == uuid.UUID(provider_id)))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(404, "Provider not found")

    for key in ("name", "base_url", "api_key", "models", "is_active"):
        if key in body:
            setattr(provider, key, body[key])

    await db.flush()
    return {"id": str(provider.id), "name": provider.name, "is_active": provider.is_active}


@router.delete("/{provider_id}")
async def delete_provider(provider_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMProvider).where(LLMProvider.id == uuid.UUID(provider_id)))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(404, "Provider not found")
    await db.delete(provider)
    await db.flush()
    return {"ok": True}


@router.get("/models")
async def list_available_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMProvider).where(LLMProvider.is_active == True))
    providers = result.scalars().all()
    models = []
    for p in providers:
        for m in (p.models or []):
            models.append({
                "model": m,
                "provider_name": p.name,
                "provider_type": p.provider_type,
                "provider_id": str(p.id),
            })
    return models


@router.get("/presets")
async def list_presets():
    return [
        {"type": k, "label": k.title(), "base_url": v["base_url"]}
        for k, v in PRESETS.items()
    ]
