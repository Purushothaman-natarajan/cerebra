"""Redis pub/sub wrapper for inter-service event streaming.

Used for:
- Streaming run events (agent_start, tool_call, run_end) to WebSocket clients
- Future cross-service messaging

Degrades gracefully when Redis is unavailable — events are lost but the app continues.
"""

import json
import logging

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis | None:
    """Lazy-init Redis connection. Returns None if Redis is unreachable."""
    global _redis
    if _redis is None:
        try:
            url = settings.redis_url
            if settings.redis_password and ":@" not in url:
                url = url.replace("redis://", f"redis://:{settings.redis_password}@")
            _redis = aioredis.from_url(url, decode_responses=True)
            await _redis.ping()
        except Exception as e:
            logger.warning("Redis not available: %s", e)
            _redis = None
    return _redis


async def publish(channel: str, message: dict):
    """Publish a JSON-serializable message to a Redis channel."""
    r = await get_redis()
    if r is None:
        return
    try:
        await r.publish(channel, json.dumps(message))
    except Exception as e:
        logger.warning("Redis publish failed: %s", e)


async def subscribe(channel: str):
    """Subscribe to a Redis channel. Returns a pubsub object or None."""
    r = await get_redis()
    if r is None:
        return None
    try:
        pubsub = r.pubsub()
        await pubsub.subscribe(channel)
        return pubsub
    except Exception as e:
        logger.warning("Redis subscribe failed: %s", e)
        return None
