from abc import ABC, abstractmethod


class AbstractChannel(ABC):
    @abstractmethod
    async def send_message(self, chat_id: str, text: str) -> bool:
        ...

    @abstractmethod
    async def process_webhook(self, payload: dict) -> dict | None:
        ...
