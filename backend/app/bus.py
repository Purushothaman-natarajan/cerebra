"""Event bus — Redis pub/sub with in-memory fallback and reconnection backoff.

Events are published to per-run channels and streamed to WebSocket clients.
When Redis is down, events are stored in-memory and served via asyncio.Queue.
Redis reconnection uses exponential backoff to avoid thundering herd.
"""

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None
_memory_store: dict[str, list[dict]] = defaultdict(list)
_memory_subs: dict[str, list[asyncio.Queue]] = defaultdict(list)
_redis_retry_delay: float = 0.1  # Starts at 100ms, capped at 5s
_MAX_RETRY_DELAY: float = 5.0


async def _build_redis_url() -> str:
    """Construct Redis URL with password injection if configured."""
    url = settings.redis_url
    if settings.redis_password and ":@" not in url:
        url = url.replace("redis://", f"redis://:{settings.redis_password}@")
    return url


async def get_redis() -> aioredis.Redis | None:
    """Lazy-init Redis with exponential backoff retry.

    Returns the Redis client if available, None to trigger in-memory fallback.
    Backoff resets after a successful connection.
    """
    global _redis, _redis_retry_delay
    try:
        if _redis is None:
            url = await _build_redis_url()
            _redis = aioredis.from_url(url, decode_responses=True, socket_connect_timeout=2)
        await _redis.ping()
        # Reset backoff on success
        _redis_retry_delay = 0.1
        return _redis
    except Exception as e:
        logger.warning(
            "Redis unavailable (retry in %.1fs) — using in-memory fallback: %s",
            _redis_retry_delay, e,
        )
        _redis = None
        # Exponential backoff with cap
        await asyncio.sleep(_redis_retry_delay)
        _redis_retry_delay = min(_redis_retry_delay * 2, _MAX_RETRY_DELAY)
        return None


async def publish(channel: str, message: dict[str, Any]) -> None:
    """Publish event to channel. Redis first, fall back to in-memory.

    The message is JSON-serialized for Redis and stored as-is for in-memory.
    """
    r = await get_redis()
    payload = json.dumps(message, default=str)
    if r is not None:
        try:
            await r.publish(channel, payload)
            return
        except Exception as e:
            logger.warning("Redis publish failed, falling back to memory: %s", e)
            _redis = None

    _memory_store[channel].append(message)
    for q in _memory_subs.get(channel, []):
        await q.put({"type": "message", "data": payload, "channel": channel})


async def subscribe(channel: str) -> Any:
    """Subscribe to a channel.

    Returns a Redis pubsub object or an in-memory _MemoryPubSub.
    The returned object has async ``listen()``, ``unsubscribe()``, and ``close()`` methods.
    """
    r = await get_redis()
    if r is not None:
        try:
            pubsub = r.pubsub()
            await pubsub.subscribe(channel)
            return pubsub
        except Exception as e:
            logger.warning("Redis subscribe failed, falling back to memory: %s", e)
            _redis = None

    queue: asyncio.Queue = asyncio.Queue()
    _memory_subs[channel].append(queue)
    for event in _memory_store.get(channel, []):
        await queue.put({"type": "message", "data": json.dumps(event, default=str), "channel": channel})
    return _MemoryPubSub(channel, queue)


class _MemoryPubSub:
    """In-memory pub/sub using asyncio.Queue.

    Serves as a drop-in replacement for Redis pub/sub when Redis is unavailable.
    Implements the same ``listen()``, ``unsubscribe()``, and ``close()`` interface.
    """

    def __init__(self, channel: str, queue: asyncio.Queue) -> None:
        self.channel = channel
        self._queue = queue

    async def listen(self):
        """Yield messages from the queue as they arrive."""
        while True:
            msg = await self._queue.get()
            yield msg

    async def unsubscribe(self):
        """Remove this subscriber from the channel's subscriber list."""
        if self.channel in _memory_subs:
            _memory_subs[self.channel] = [
                q for q in _memory_subs[self.channel] if q is not self._queue
            ]

    async def close(self):
        """Clean up subscription."""
        await self.unsubscribe()
