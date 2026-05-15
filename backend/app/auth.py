"""API authentication middleware.

Supports two modes:
1. **No auth** — if CEREBRA_API_KEY is empty, all requests pass through.
2. **Bearer token** — clients must send `Authorization: Bearer <key>` header.

Public paths (health, docs, Telegram webhook) are excluded.
WebSocket connections authenticate via `?token=` query parameter.
All auth failures are logged with structured details for observability.
"""

from fastapi import Request, WebSocket
from fastapi.responses import JSONResponse
from app.logging_config import get_logger

from app.config import settings

logger = get_logger(__name__)

_PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/channels/webhook/telegram"}


async def verify_api_key(request: Request) -> JSONResponse | None:
    """FastAPI middleware that validates the Authorization header against CEREBRA_API_KEY.

    Returns a JSON 401 response if auth fails, None if allowed.
    """
    if not settings.cerebra_api_key:
        return None
    if request.url.path in _PUBLIC_PATHS or request.url.path.startswith(("/docs/", "/redoc/")):
        return None
    auth = request.headers.get("Authorization", "")
    token = auth.removeprefix("Bearer ").strip()
    if token != settings.cerebra_api_key:
        logger.warning("Authentication failed", extra={
            "path": str(request.url.path), "method": request.method,
            "client_ip": request.client.host if request.client else "unknown",
        })
        return JSONResponse(status_code=401, content={"detail": "Invalid or missing API key"})
    return None


async def verify_ws_key(websocket: WebSocket) -> bool:
    """Validates WebSocket connections via ?token= query parameter."""
    if not settings.cerebra_api_key:
        return True
    token = websocket.query_params.get("token")
    if token == settings.cerebra_api_key:
        return True
    logger.warning("WebSocket authentication failed", extra={
        "path": str(websocket.url.path),
    })
    await websocket.close(code=4001, reason="Unauthorized")
    return False
