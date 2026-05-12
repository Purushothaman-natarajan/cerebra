import json
import logging

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        try:
            _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
            await _redis.ping()
        except Exception as e:
            logger.warning("Redis not available: %s", e)
            _redis = None
    return _redis


async def publish(channel: str, message: dict):
    r = await get_redis()
    if r is None:
        return
    try:
        await r.publish(channel, json.dumps(message))
    except Exception as e:
        logger.warning("Redis publish failed: %s", e)


async def subscribe(channel: str):
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
