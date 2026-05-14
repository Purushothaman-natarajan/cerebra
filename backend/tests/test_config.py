"""Tests for configuration loading and defaults."""

from app.config import Settings


def test_settings_defaults():
    s = Settings()
    assert s.database_url.startswith("postgresql+asyncpg")
    assert s.redis_url.startswith("redis://")
    assert s.cors_origins == "http://localhost:5173,http://localhost:8000"
    assert s.db_pool_size == 5
    assert s.db_max_overflow == 10


def test_settings_custom_env(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("CEREBRA_API_KEY", "my-api-key")
    s = Settings()
    assert s.gemini_api_key == "test-key"
    assert s.cerebra_api_key == "my-api-key"
