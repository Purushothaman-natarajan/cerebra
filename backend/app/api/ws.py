"""WebSocket endpoint for live run event streaming.

Clients connect to /ws/runs/{run_id} to receive real-time events
as the workflow executes. Events are published to Redis by the executor.
"""

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.auth import verify_ws_key
from app.bus import subscribe

router = APIRouter()


@router.websocket("/ws/runs/{run_id}")
async def run_logs(websocket: WebSocket, run_id: str):
    """Stream run events to the connected WebSocket client in real-time."""
    if not await verify_ws_key(websocket):
        return

    await websocket.accept()

    pubsub = await subscribe(f"run:events:{run_id}")
    if pubsub is None:
        await websocket.send_json({"type": "error", "payload": {"message": "Event bus unavailable"}})
        await websocket.close()
        return

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            await websocket.send_json(json.loads(message["data"]))
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe()
        await pubsub.close()
