"""WebSocket endpoint for live run event streaming with ping/pong heartbeat.

Clients connect to /ws/runs/{run_id} to receive real-time events
as the workflow executes. Events are published to Redis by the executor.
The endpoint also handles client ping messages for connection keepalive.
Origin validation uses the CORS origins from settings (configurable via CORS_ORIGINS env var).
"""

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.config import settings
from app.logging_config import get_logger

from app.auth import verify_ws_key
from app.bus import subscribe

router = APIRouter()

_VALID_ORIGINS = set(settings.cors_origin_list()) if settings.cors_origins else {"http://localhost:5173"}
_PING_TIMEOUT = 60  # Close connection if no client message received for 60s

logger = get_logger(__name__)


@router.websocket("/ws/runs/{run_id}")
async def run_logs(websocket: WebSocket, run_id: str):
    """Stream run events to the connected WebSocket client in real-time.

    Supports:
    - Event streaming from Redis pub/sub channel ``run:events:{run_id}``
    - Client ping messages (``{"type": "ping"}`` respond with ``{"type": "pong"}``)
    - Automatic origin validation and WebSocket auth
    """
    origin = websocket.headers.get("origin", "")
    if origin and origin not in _VALID_ORIGINS and "localhost" not in origin:
        await websocket.close(code=4001, reason="Origin not allowed")
        return

    if not await verify_ws_key(websocket):
        return

    await websocket.accept()
    logger.info("WebSocket connected", extra={"run_id": run_id})

    pubsub = await subscribe(f"run:events:{run_id}")
    if pubsub is None:
        logger.error("WebSocket event bus unavailable", extra={"run_id": run_id})
        await websocket.send_json({"type": "error", "payload": {"message": "Event bus unavailable"}})
        await websocket.close()
        return

    async def _send_events():
        """Read events from pubsub and forward to WebSocket."""
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            try:
                await websocket.send_json(json.loads(message["data"]))
            except Exception:
                break

    async def _recv_pings():
        """Read client messages and respond to pings."""
        try:
            while True:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=_PING_TIMEOUT)
                try:
                    data = json.loads(raw)
                    if data.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                except (json.JSONDecodeError, TypeError):
                    pass  # Ignore malformed messages
        except (asyncio.TimeoutError, WebSocketDisconnect):
            pass

    try:
        await asyncio.gather(_send_events(), _recv_pings())
    except Exception:
        logger.debug("WebSocket client disconnected", extra={"run_id": run_id})
    finally:
        logger.info("WebSocket disconnected", extra={"run_id": run_id})
        await pubsub.unsubscribe()
        await pubsub.close()
