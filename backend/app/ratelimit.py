"""In-memory rate limiting middleware using sliding window counters.

No external dependencies. Limits are per-IP-address and reset on server restart.
Supports different limits for different path patterns.
"""

import time
from collections import defaultdict

from fastapi import Request
from fastapi.responses import JSONResponse

_RATE_LIMITS: dict[str, tuple[int, int]] = {
    "/runs": (10, 60),       # 10 requests per 60 seconds for LLM runs
    "default": (100, 60),    # 100 requests per 60 seconds for other endpoints
}

_PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}

_window: dict[str, list[float]] = defaultdict(list)


def _get_limit(path: str) -> tuple[int, int]:
    for prefix, limit in _RATE_LIMITS.items():
        if path.startswith(prefix):
            return limit
    return _RATE_LIMITS["default"]


async def rate_limit_middleware(request: Request, call_next):
    """Check rate limits before passing request to the next handler.

    Returns 429 Too Many Requests if the client exceeds the limit.
    """
    path = request.url.path
    if path in _PUBLIC_PATHS:
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    max_req, window_sec = _get_limit(path)
    now = time.time()
    key = f"{client_ip}:{path}"

    timestamps = _window[key]
    cutoff = now - window_sec
    timestamps = [t for t in timestamps if t > cutoff]
    _window[key] = timestamps

    if len(timestamps) >= max_req:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down."},
            headers={"Retry-After": str(int(window_sec))},
        )

    _window[key].append(now)
    return await call_next(request)
