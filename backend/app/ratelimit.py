"""In-memory rate limiting and request size middleware.

Rate limiting uses a sliding window counter per IP per path.
Request size limit prevents oversized payloads.
Rate limit hits are logged with structured details for observability.
"""

import time
from collections import defaultdict

from fastapi import Request
from fastapi.responses import JSONResponse
from app.logging_config import get_logger

logger = get_logger(__name__)

_RATE_LIMITS: dict[str, tuple[int, int]] = {
    "/runs": (10, 60),
    "default": (100, 60),
}

_PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}
_MAX_BODY_SIZE = 5 * 1024 * 1024  # 5 MB

_window: dict[str, list[float]] = defaultdict(list)


def _get_limit(path: str) -> tuple[int, int]:
    for prefix, limit in _RATE_LIMITS.items():
        if path.startswith(prefix):
            return limit
    return _RATE_LIMITS["default"]


async def limit_middleware(request: Request, call_next):
    """Check request body size and rate limits before passing to handler.

    Returns 413 if body too large, 429 if rate limited.
    """
    path = request.url.path
    if path in _PUBLIC_PATHS:
        return await call_next(request)

    # Body size check
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > _MAX_BODY_SIZE:
        logger.warning("Request body too large", extra={
            "path": path, "content_length": int(content_length),
        })
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large. Maximum size is 5 MB."},
        )

    # Rate limit
    client_ip = request.client.host if request.client else "unknown"
    max_req, window_sec = _get_limit(path)
    now = time.time()
    key = f"{client_ip}:{path}"

    timestamps = _window[key]
    cutoff = now - window_sec
    timestamps = [t for t in timestamps if t > cutoff]
    _window[key] = timestamps

    if len(timestamps) >= max_req:
        logger.warning("Rate limit exceeded", extra={
            "client_ip": client_ip, "path": path,
            "limit": max_req, "window_seconds": window_sec,
        })
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down."},
            headers={"Retry-After": str(int(window_sec))},
        )

    _window[key].append(now)
    return await call_next(request)
