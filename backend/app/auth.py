from fastapi import HTTPException, Request, WebSocket, status

from app.config import settings

_PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/channels/webhook/telegram"}


async def verify_api_key(request: Request) -> None:
    if not settings.cerebra_api_key:
        return
    if request.url.path in _PUBLIC_PATHS or request.url.path.startswith(("/docs/", "/redoc/")):
        return
    auth = request.headers.get("Authorization", "")
    token = auth.removeprefix("Bearer ").strip()
    if token != settings.cerebra_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API key")


async def verify_ws_key(websocket: WebSocket) -> bool:
    if not settings.cerebra_api_key:
        return True
    token = websocket.query_params.get("token")
    if token == settings.cerebra_api_key:
        return True
    await websocket.close(code=4001, reason="Unauthorized")
    return False
