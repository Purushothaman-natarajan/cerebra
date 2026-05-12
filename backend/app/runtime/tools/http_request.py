import ipaddress
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


def _is_private_url(url: str) -> bool:
    parsed = urlparse(url)
    host = parsed.hostname
    if not host:
        return True
    try:
        addr = ipaddress.ip_address(host)
        return any(addr in block for block in _PRIVATE_BLOCKS)
    except ValueError:
        return host in ("localhost", "127.0.0.1", "::1", "0.0.0.0")


@register("http_request")
async def http_request(url: str, method: str = "GET", body: str = "") -> str:
    """Make an HTTP request to external URLs only. Input: url, method (GET/POST), optional body. Output: response text (first 2000 chars)."""
    if _is_private_url(url):
        return "Error: Requests to private/internal addresses are not allowed"

    try:
        async with httpx.AsyncClient() as client:
            if method.upper() == "GET":
                resp = await client.get(url, timeout=10)
            else:
                resp = await client.post(url, content=body, timeout=10)
            return resp.text[:2000]
    except Exception as e:
        return f"HTTP request failed: {e}"
