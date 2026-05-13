from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.services import provider_service

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


@router.get("/presets")
async def list_presets():
    return [{"type": k, "label": k.title(), "base_url": v["base_url"]} for k, v in PRESETS.items()]
