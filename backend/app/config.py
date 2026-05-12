from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cerebra"
    redis_url: str = "redis://localhost:6379/0"
    gemini_api_key: str = ""
    telegram_bot_token: str = ""
    telegram_webhook_url: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
