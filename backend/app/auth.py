"""API authentication middleware.

Supports two modes:
1. **No auth** — if CEREBRA_API_KEY is empty or "no_key", all requests pass through.
2. **Bearer token** — clients must send `Authorization: Bearer <key>` header.

Public paths (health, docs, Telegram webhook) are excluded.
WebSocket connections authenticate via `?token=` query parameter.
All auth failures are logged with structured details for observability.
"""

import os
from pathlib import Path

from fastapi import Request, WebSocket
from fastapi.responses import JSONResponse
from app.logging_config import get_logger

from app.config import settings

logger = get_logger(__name__)

_PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/channels/webhook/telegram"}


def _auth_disabled() -> bool:
    """Check if authentication is disabled.

    Auth is disabled when CEREBRA_API_KEY is empty or 'no_key'.
    """
    if not settings.cerebra_api_key or settings.cerebra_api_key == "no_key":
        return True
    # If settings has a real key value, respect it — don't check .env
    if len(settings.cerebra_api_key) > 6:
        return False
    # Only reach here if settings returned something short/ambiguous.
    # Fallback: read .env directly in case pydantic-settings didn't find it
    # (e.g., when running via uv run from backend/ subdirectory).
    try:
        env = Path(__file__).resolve().parent.parent.parent / ".env"
        if env.exists():
            for line in env.read_text().splitlines():
                line = line.strip()
                if line.startswith("CEREBRA_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip("\"'")
                    if not val or val == "no_key":
                        return True
    except Exception:
        pass
    return False


async def verify_api_key(request: Request) -> JSONResponse | None:
    """FastAPI middleware that validates the Authorization header against CEREBRA_API_KEY.

    Returns a JSON 401 response if auth fails, None if allowed.
    """
    if _auth_disabled():
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
        return JSONResponse(
            status_code=401,
            content={
                "detail": "Invalid or missing API key",
                "message": "Set CEREBRA_API_KEY in your .env file or pass it as a Bearer token in the Authorization header. "
                           "Without the correct key, you can browse but not execute workflows or access LLM providers.",
            },
        )
    return None


async def verify_ws_key(websocket: WebSocket) -> bool:
    """Validates WebSocket connections via ?token= query parameter."""
    if _auth_disabled():
        return True
    token = websocket.query_params.get("token")
    if token == settings.cerebra_api_key:
        return True
    logger.warning("WebSocket authentication failed", extra={
        "path": str(websocket.url.path),
    })
    await websocket.close(code=4001, reason="Unauthorized")
    return False
