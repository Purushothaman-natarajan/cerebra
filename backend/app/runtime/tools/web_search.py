"""Web search tool using DuckDuckGo's HTML endpoint.

Falls back to a simple prefix search on the URL. Returns raw HTML snippets.
The LLM is instructed to extract relevant text from the response.
"""

import httpx
from bs4 import BeautifulSoup

from app.runtime.tools.registry import register


@register("web_search")
async def web_search(query: str) -> str:
    """Search the web using DuckDuckGo. Input: search query string. Output: result snippets."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            resp = await client.get(
                "https://lite.duckduckgo.com/lite/",
                params={"q": query},
            )
            soup = BeautifulSoup(resp.text, "html.parser")
            results = soup.find_all("a", class_="result-link")
            if results:
                return "\n".join(
                    f"{i+1}. {a.get_text(strip=True)}" for i, a in enumerate(results[:10])
                )
            return resp.text[:2000]
    except Exception:
        return f"No results found for: {query}"
