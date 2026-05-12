import httpx

from app.runtime.tools.registry import register


@register("http_request")
async def http_request(url: str, method: str = "GET", body: str = "") -> str:
    """Make an HTTP request. Input: url, method (GET/POST), optional body. Output: response text."""
    try:
        async with httpx.AsyncClient() as client:
            if method.upper() == "GET":
                resp = await client.get(url, timeout=10)
            else:
                resp = await client.post(url, content=body, timeout=10)
            return resp.text[:2000]
    except Exception as e:
        return f"HTTP request failed: {e}"
