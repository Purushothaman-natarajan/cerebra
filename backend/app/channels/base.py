"""Abstract channel interface for messaging integrations.

All messaging channels (Telegram, future Slack/WhatsApp) implement this interface.
"""

from abc import ABC, abstractmethod


class AbstractChannel(ABC):
    """Base class for messaging channel integrations."""

    @abstractmethod
    async def send_message(self, chat_id: str, text: str) -> bool:
        """Send a message to a channel user or thread."""

    @abstractmethod
    async def process_webhook(self, payload: dict) -> dict | None:
        """Parse an incoming webhook payload into a standardized format."""
