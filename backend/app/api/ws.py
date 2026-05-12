import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.bus import subscribe

router = APIRouter()


@router.websocket("/ws/runs/{run_id}")
async def run_logs(websocket: WebSocket, run_id: str):
    await websocket.accept()

    pubsub = await subscribe("run:events")
    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            data = json.loads(message["data"])
            if data.get("run_id") == run_id:
                await websocket.send_json(data)
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe()
        await pubsub.close()
