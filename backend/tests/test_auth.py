"""Tests for auth middleware and encryption."""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth import verify_api_key, verify_ws_key
from app.db import Base, get_db
from app.main import app
from app.security import encrypt_value, decrypt_value, mask_key
from app.config import settings


class TestSecurity:
    def test_mask_key_short(self):
        assert mask_key("abc") == "********"

    def test_mask_key_long(self):
        masked = mask_key("sk-test1234567890abc")
        assert masked == "sk-t...0abc"
        assert "test" not in masked

    def test_encrypt_decrypt_roundtrip(self):
        settings.encryption_key = "test-encryption-key-32bytes!!"
        original = "sk-test-api-key-12345"
        encrypted = encrypt_value(original)
        assert encrypted != original
        decrypted = decrypt_value(encrypted)
        assert decrypted == original
        settings.encryption_key = ""


class TestAuth:
    @pytest.mark.asyncio
    async def test_verify_ws_key_no_auth_set(self):
        """When CEREBRA_API_KEY is empty, all WS connections pass."""
        settings.cerebra_api_key = ""
        result = await verify_ws_key(None)
        assert result is True


@pytest.mark.asyncio
async def test_auth_middleware_enforces_key():
    """Test that auth middleware returns 401 with wrong key."""
    settings.cerebra_api_key = "test-key"

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_db():
        async with session_factory() as s:
            yield s

    app.dependency_overrides[get_db] = override_db
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/agents")
        assert resp.status_code == 401

        resp = await client.get("/agents", headers={"Authorization": "Bearer test-key"})
        assert resp.status_code == 200

        resp = await client.get("/agents", headers={"Authorization": "Bearer wrong-key"})
        assert resp.status_code == 401

    app.dependency_overrides.clear()
    settings.cerebra_api_key = ""
    await engine.dispose()
