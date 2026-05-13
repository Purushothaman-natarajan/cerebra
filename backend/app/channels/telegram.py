"""Telegram bot channel implementation.

Uses raw httpx to call the Telegram Bot API (no heavy framework).
Supports sending messages and receiving webhooks.
"""

import httpx

from app.channels.base import AbstractChannel


class TelegramChannel(AbstractChannel):
    """Telegram bot integration via Bot API."""

    def __init__(self, bot_token: str, webhook_url: str | None = None):
        self.bot_token = bot_token
        self.api_base = f"https://api.telegram.org/bot{bot_token}"
        self.webhook_url = webhook_url

    async def send_message(self, chat_id: str, text: str) -> bool:
        """Send a text message to a Telegram chat."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.api_base}/sendMessage",
                json={"chat_id": int(chat_id), "text": text},
                timeout=10,
            )
            return resp.status_code == 200

    async def process_webhook(self, payload: dict) -> dict | None:
        """Parse a Telegram webhook payload into a standardized format."""
        message = payload.get("message", {})
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")
        if not chat_id or not text:
            return None
        return {"channel_type": "telegram", "chat_id": str(chat_id), "text": text, "raw": payload}

    async def set_webhook(self) -> bool:
        """Register the webhook URL with Telegram."""
        if not self.webhook_url:
            return False
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.api_base}/setWebhook",
                json={"url": self.webhook_url},
                timeout=10,
            )
            return resp.status_code == 200
