import httpx

from app.runtime.tools.registry import register


@register("web_search")
async def web_search(query: str) -> str:
    """Search the web. Input: a search query string. Output: search result snippets."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://lite.duckduckgo.com/lite/",
                params={"q": query},
                timeout=10,
            )
            return resp.text[:2000]
    except Exception:
        return "Search failed"
