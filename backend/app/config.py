"""Application configuration via environment variables with Pydantic validation.

All settings are loaded from `.env` file (project root) or environment variables.
Uses pydantic-settings for validation and type coercion.
"""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables.

    Every field has a default so the app boots without a .env file.
    Required values (gemini_api_key) will error at first LLM call if unset.
    """

    # --- Database ---
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/cerebra",
        description="PostgreSQL connection string (asyncpg driver). Use sqlite+aiosqlite for local dev.",
    )

    # --- Redis ---
    redis_url: str = Field(
        default="redis://:password@localhost:6379/0",
        description="Redis connection string for pub/sub event bus and rate limiting.",
    )
    redis_password: str = Field(default="", description="Redis password (injected into URL if set).")

    # --- LLM Providers ---
    gemini_api_key: str = Field(default="", description="Google Gemini API key for LLM inference.")

    # --- Telegram ---
    telegram_bot_token: str = Field(default="", description="Telegram bot token for channel integration.")
    telegram_webhook_url: str = Field(default="", description="Public HTTPS URL for Telegram webhook.")

    # --- CORS ---
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:8000",
        description="Comma-separated list of allowed CORS origins.",
    )

    # --- Auth ---
    cerebra_api_key: str = Field(default="", description="API key for bearer-token auth. Empty = no auth.")

    # --- Security ---
    encryption_key: str = Field(default="", description="Secret key for API key encryption at rest (32+ chars).")

    # --- Pool ---
    db_pool_size: int = Field(default=5, ge=1, le=50, description="SQLAlchemy connection pool size.")
    db_max_overflow: int = Field(default=10, ge=0, le=50, description="Max overflow connections for pool.")

    # --- Observability ---
    log_level: str = Field(default="INFO", description="Logging level (DEBUG, INFO, WARNING, ERROR).")
    log_format: str = Field(default="console", description="Log output format: console (human-readable) or json (structured).")
    service_name: str = Field(default="cerebra-backend", description="Service name for structured logging.")

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v.startswith(("postgresql+asyncpg://", "sqlite+aiosqlite://")):
            raise ValueError("DATABASE_URL must use asyncpg or aiosqlite driver")
        return v

    @field_validator("encryption_key")
    @classmethod
    def validate_encryption_key(cls, v: str) -> str:
        if v and len(v) < 16:
            raise ValueError("ENCRYPTION_KEY must be at least 16 characters when set")
        return v

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, v: str) -> str:
        if v:
            origins = [o.strip() for o in v.split(",") if o.strip()]
            for origin in origins:
                if not origin.startswith(("http://", "https://", "null")):
                    raise ValueError(f"Invalid CORS origin: {origin} (must start with http:// or https://)")
        return v

    def cors_origin_list(self) -> List[str]:
        """Return parsed CORS origins as a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()] if self.cors_origins else []

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
