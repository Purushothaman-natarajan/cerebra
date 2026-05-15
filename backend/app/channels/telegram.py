"""Telegram bot channel implementation.

Uses raw httpx to call the Telegram Bot API (no heavy framework).
Supports sending messages, receiving webhooks, and token validation.
"""

import httpx

from app.channels.base import AbstractChannel
from app.logging_config import get_logger

logger = get_logger(__name__)


class TelegramChannel(AbstractChannel):
    """Telegram bot integration via Bot API.

    Uses a per-channel bot token (not the global settings).
    """

    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.api_base = f"https://api.telegram.org/bot{bot_token}"

    async def send_message(self, chat_id: str, text: str) -> bool:
        """Send a text message to a Telegram chat chat_id."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{self.api_base}/sendMessage",
                    json={"chat_id": int(chat_id), "text": text, "parse_mode": "HTML"},
                )
                data = resp.json()
                if not data.get("ok"):
                    logger.warning("Telegram send_message failed", extra={"error": data.get("description", "")})
                return data.get("ok", False)
        except Exception as exc:
            logger.error("Telegram send_message error", extra={"error": str(exc)})
            return False

    async def process_webhook(self, payload: dict) -> dict | None:
        """Parse a Telegram webhook payload into a standardized format.

        Handles messages, callback queries, and channel posts.
        Returns a dict with channel_type, chat_id, text, and raw payload,
        or None if the payload doesn't contain a parsable message.
        """
        # Support both "message" and "channel_post" and "callback_query"
        message = payload.get("message") or payload.get("channel_post") or {}
        cb_query = payload.get("callback_query", {})

        if cb_query:
            message = cb_query.get("message", {})
            text = cb_query.get("data", "")
            chat_id = message.get("chat", {}).get("id") if message else None
        else:
            chat_id = message.get("chat", {}).get("id")
            text = message.get("text", "")

        if not chat_id:
            return None
        return {
            "channel_type": "telegram",
            "chat_id": str(chat_id),
            "text": text or "(empty)",
            "raw": payload,
        }

    async def set_webhook(self, url: str) -> tuple[bool, str]:
        """Register or update the webhook URL with Telegram.

        Args:
            url: Full public HTTPS URL for Telegram to send updates to.
                 Must include the path, e.g. https://example.com/channels/webhook/telegram

        Returns:
            Tuple of (success: bool, description: str)
        """
        if not url:
            return False, "Webhook URL is required"
        if not url.startswith("https://"):
            return False, "Webhook URL must use HTTPS (use ngrok for local development)"

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{self.api_base}/setWebhook",
                    json={"url": url, "allowed_updates": ["message", "channel_post", "callback_query"]},
                )
                data = resp.json()
                if data.get("ok"):
                    # Also get current webhook info to verify
                    info_resp = await client.get(f"{self.api_base}/getWebhookInfo")
                    info = info_resp.json()
                    pending = info.get("result", {}).get("pending_update_count", 0)
                    desc = f"Webhook set. Pending updates: {pending}"
                    if info.get("result", {}).get("last_error_date"):
                        desc += f" | Last error: {info.get('result', {}).get('last_error_message', 'unknown')}"
                    return True, desc
                return False, data.get("description", "Unknown error from Telegram API")
        except httpx.RequestError as e:
            return False, f"Cannot reach Telegram API: {e}"
        except Exception as e:
            return False, f"Unexpected error: {e}"
