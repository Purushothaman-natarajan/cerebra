import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.bus import subscribe

router = APIRouter()


@router.websocket("/ws/runs/{run_id}")
async def run_logs(websocket: WebSocket, run_id: str):
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
            data = json.loads(message["data"])
            await websocket.send_json(data)
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe()
        await pubsub.close()
