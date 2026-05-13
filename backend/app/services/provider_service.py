"""LLM provider business logic with encryption-at-rest for API keys."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.provider import LLMProvider
from app.security import decrypt_value, encrypt_value, mask_key


async def list_providers(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(LLMProvider).order_by(LLMProvider.created_at.desc()))
    return [
        {
            "id": str(p.id), "name": p.name, "provider_type": p.provider_type,
            "base_url": p.base_url, "models": p.models, "is_active": p.is_active,
            "api_key": mask_key(decrypt_value(p.api_key)) if p.api_key else "",
            "created_at": p.created_at.isoformat(),
        }
        for p in result.scalars().all()
    ]


async def create_provider(db: AsyncSession, data: dict) -> dict:
    provider = LLMProvider(
        name=data["name"], provider_type=data.get("provider_type", "custom"),
        base_url=data.get("base_url", ""), api_key=encrypt_value(data.get("api_key", "")),
        models=data.get("models", []), is_active=data.get("is_active", True),
    )
    db.add(provider)
    await db.flush()
    return {
        "id": str(provider.id), "name": provider.name, "provider_type": provider.provider_type,
        "base_url": provider.base_url, "models": provider.models, "is_active": provider.is_active,
        "api_key": mask_key(data.get("api_key", "")) if data.get("api_key") else "",
        "created_at": provider.created_at.isoformat(),
    }


async def update_provider(db: AsyncSession, provider_id: str, data: dict) -> dict | None:
    result = await db.execute(select(LLMProvider).where(LLMProvider.id == uuid.UUID(provider_id)))
    provider = result.scalar_one_or_none()
    if not provider:
        return None
    for key in ("name", "base_url", "models", "is_active"):
        if key in data:
            setattr(provider, key, data[key])
    if "api_key" in data:
        provider.api_key = encrypt_value(data["api_key"])
    await db.flush()
    return {"id": str(provider.id), "name": provider.name, "is_active": provider.is_active}


async def delete_provider(db: AsyncSession, provider_id: str) -> bool:
    result = await db.execute(select(LLMProvider).where(LLMProvider.id == uuid.UUID(provider_id)))
    provider = result.scalar_one_or_none()
    if not provider:
        return False
    await db.delete(provider)
    await db.flush()
    return True


async def get_decrypted_api_key(db: AsyncSession, provider_id: str) -> str | None:
    result = await db.execute(select(LLMProvider).where(LLMProvider.id == uuid.UUID(provider_id)))
    provider = result.scalar_one_or_none()
    return decrypt_value(provider.api_key) if provider and provider.api_key else None
