"""Event bus — Redis pub/sub with in-memory fallback.

Events are published to per-run channels and streamed to WebSocket clients.
When Redis is down, events are stored in-memory and served via asyncio.Queue.
Redis reconnection is attempted on each publish/subscribe call.
"""

import asyncio
import json
import logging
from collections import defaultdict

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None
_memory_store: dict[str, list[dict]] = defaultdict(list)
_memory_subs: dict[str, list[asyncio.Queue]] = defaultdict(list)


async def get_redis() -> aioredis.Redis | None:
    """Lazy-init Redis. Clears cached connection on failure so retry is possible."""
    global _redis
    try:
        if _redis is None:
            url = settings.redis_url
            if settings.redis_password and ":@" not in url:
                url = url.replace("redis://", f"redis://:{settings.redis_password}@")
            _redis = aioredis.from_url(url, decode_responses=True)
        await _redis.ping()
        return _redis
    except Exception as e:
        logger.warning("Redis unavailable — using in-memory event bus: %s", e)
        _redis = None
        return None


async def publish(channel: str, message: dict):
    """Publish event to channel. Redis first, fall back to in-memory."""
    r = await get_redis()
    payload = json.dumps(message)
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


async def subscribe(channel: str):
    """Subscribe to channel. Returns Redis pubsub or in-memory _MemoryPubSub."""
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
        await queue.put({"type": "message", "data": json.dumps(event), "channel": channel})
    return _MemoryPubSub(channel, queue)


class _MemoryPubSub:
    """In-memory pubsub using asyncio.Queue. Replaces Redis pubsub when unavailable."""

    def __init__(self, channel: str, queue: asyncio.Queue):
        self.channel = channel
        self._queue = queue

    async def listen(self):
        while True:
            msg = await self._queue.get()
            yield msg

    async def unsubscribe(self):
        if self.channel in _memory_subs:
            _memory_subs[self.channel] = [q for q in _memory_subs[self.channel] if q is not self._queue]

    async def close(self):
        await self.unsubscribe()
