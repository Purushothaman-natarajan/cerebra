"""Event bus — Redis pub/sub with in-memory fallback for when Redis is unavailable.

Events are published to Redis (per-run channels) and streamed to WebSocket clients.
When Redis is down, events are stored in-memory and served directly.
"""

import asyncio
import json
import logging
from collections import defaultdict

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None

# In-memory fallback: channel_name -> list of event dicts
_memory_store: dict[str, list[dict]] = defaultdict(list)
# In-memory subscribers: channel_name -> list of asyncio.Queue
_memory_subs: dict[str, list[asyncio.Queue]] = defaultdict(list)


async def get_redis() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        try:
            url = settings.redis_url
            if settings.redis_password and ":@" not in url:
                url = url.replace("redis://", f"redis://:{settings.redis_password}@")
            _redis = aioredis.from_url(url, decode_responses=True)
            await _redis.ping()
        except Exception as e:
            logger.warning("Redis not available — using in-memory event bus: %s", e)
            _redis = None
    return _redis


async def publish(channel: str, message: dict):
    """Publish an event to a channel. Uses Redis if available, else in-memory."""
    r = await get_redis()
    payload = json.dumps(message)
    if r is not None:
        try:
            await r.publish(channel, payload)
            return
        except Exception as e:
            logger.warning("Redis publish failed, falling back to memory: %s", e)

    # In-memory fallback
    _memory_store[channel].append(message)
    for q in _memory_subs.get(channel, []):
        await q.put({"type": "message", "data": payload, "channel": channel})


async def subscribe(channel: str):
    """Subscribe to a channel. Returns an async iterator of messages."""
    r = await get_redis()
    if r is not None:
        try:
            pubsub = r.pubsub()
            await pubsub.subscribe(channel)
            return pubsub
        except Exception as e:
            logger.warning("Redis subscribe failed, falling back to memory: %s", e)

    # In-memory fallback: return an async generator that yields stored + future events
    queue: asyncio.Queue = asyncio.Queue()
    _memory_subs[channel].append(queue)

    # Replay past events from this run
    for event in _memory_store.get(channel, []):
        await queue.put({"type": "message", "data": json.dumps(event), "channel": channel})

    return _MemoryPubSub(channel, queue)


class _MemoryPubSub:
    """Async generator wrapper around an asyncio.Queue, mimics Redis pubsub."""

    def __init__(self, channel: str, queue: asyncio.Queue):
        self.channel = channel
        self._queue = queue

    async def listen(self):
        while True:
            try:
                msg = await asyncio.wait_for(self._queue.get(), timeout=300)
                yield msg
            except asyncio.TimeoutError:
                continue

    async def unsubscribe(self):
        if self.channel in _memory_subs:
            _memory_subs[self.channel] = [q for q in _memory_subs[self.channel] if q is not self._queue]

    async def close(self):
        await self.unsubscribe()
