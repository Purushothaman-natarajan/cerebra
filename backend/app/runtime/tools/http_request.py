import asyncio
import ipaddress
import socket
from urllib.parse import urlparse

import httpx

from app.runtime.tools.registry import register

_PRIVATE_BLOCKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


async def _is_private_url(url: str) -> bool:
    parsed = urlparse(url)
    host = parsed.hostname
    if not host:
        return True

    known_private = ("localhost", "127.0.0.1", "::1", "0.0.0.0", "host.docker.internal")
    if host in known_private:
        return True

    loop = asyncio.get_event_loop()
    try:
        # Add timeout to DNS resolution to prevent hanging
        addrs = await asyncio.wait_for(
            loop.getaddrinfo(host, None),
            timeout=5.0,
        )
        for family, _, _, _, sockaddr in addrs:
            if family in (socket.AF_INET, socket.AF_INET6):
                try:
                    addr = ipaddress.ip_address(sockaddr[0])
                    if any(addr in block for block in _PRIVATE_BLOCKS):
                        return True
                except ValueError:
                    continue
    except (OSError, asyncio.TimeoutError):
        return True

    return False


@register("http_request")
async def http_request(url: str, method: str = "GET", body: str = "") -> str:
    """Make an HTTP request to external URLs only. Input: url, method (GET/POST). Output: response text."""
    if await _is_private_url(url):
        return "Error: Requests to private/internal addresses are not allowed"

    try:
        async with httpx.AsyncClient() as client:
            if method.upper() == "GET":
                resp = await client.get(url, timeout=10)
            else:
                resp = await client.post(url, content=body, timeout=10)
            return resp.text[:2000]
    except Exception:
        return "Error: HTTP request failed"
