"""Application configuration via environment variables.

All settings are loaded from `.env` file or environment variables with sensible defaults.
Uses pydantic-settings for validation and type coercion.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables.

    Every field has a default so the app boots without a .env file.
    Required values (gemini_api_key) will error at first LLM call if unset.
    """

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cerebra"
    redis_url: str = "redis://:password@localhost:6379/0"
    redis_password: str = ""
    gemini_api_key: str = ""
    telegram_bot_token: str = ""
    telegram_webhook_url: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:8000"
    cerebra_api_key: str = ""
    encryption_key: str = ""
    db_pool_size: int = 5
    db_max_overflow: int = 10

    class Config:
        env_file = ".env"


settings = Settings()
