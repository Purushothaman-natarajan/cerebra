"""Web search tool using DuckDuckGo HTML search with proper result extraction."""

import re
import urllib.parse

import httpx
from bs4 import BeautifulSoup

from app.runtime.tools.registry import register


@register("web_search")
async def web_search(query: str) -> str:
    """Search the web using DuckDuckGo. Input: search query. Output: result snippets with titles and URLs."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            resp = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query},
                headers={"User-Agent": "Mozilla/5.0 (compatible; Cerebra-AI/1.0)"},
            )

        soup = BeautifulSoup(resp.text, "html.parser")
        results = soup.select(".result")

        snippets = []
        for i, result in enumerate(results[:8], 1):
            title_el = result.select_one(".result__title a")
            snippet_el = result.select_one(".result__snippet")

            title = title_el.get_text(strip=True) if title_el else ""
            url = title_el.get("href", "") if title_el else ""
            # DuckDuckGo redirect URLs need decoding
            if "//duckduckgo.com/l/" in url:
                url = re.search(r"uddg=(.*?)&", url)
                url = urllib.parse.unquote(url.group(1)) if url else ""
            snippet = snippet_el.get_text(strip=True) if snippet_el else ""

            if title:
                snippets.append(f"{i}. {title}\n   {snippet[:200]}\n   {url[:100]}")

        if snippets:
            return "\n\n".join(snippets)

        # Fallback: return raw text if parsing fails
        text = soup.get_text(separator="\n", strip=True)
        return text[:3000]

    except Exception:
        return f"Search failed for: {query}"
