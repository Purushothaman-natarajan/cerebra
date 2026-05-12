import re

import httpx
from bs4 import BeautifulSoup

from app.runtime.tools.registry import register


@register("web_crawler")
async def web_crawler(url: str, max_chars: int = 5000) -> str:
    """Crawl a web page and extract clean text/markdown content. Input: URL to crawl, optionally max_chars (default 5000). Output: extracted page content."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; Cerebra/1.0)"})
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form", "iframe"]):
            tag.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else ""
        body = soup.find("main") or soup.find("article") or soup.find("body") or soup

        text = body.get_text(separator="\n", strip=True)
        text = re.sub(r"\n{3,}", "\n\n", text)

        lines = []
        for line in text.split("\n"):
            line = line.strip()
            if line:
                lines.append(line)

        content = "\n".join(lines)

        if title:
            content = f"# {title}\n\n{content}"

        if len(content) > max_chars:
            content = content[:max_chars] + "\n\n[Content truncated...]"

        return content

    except httpx.HTTPStatusError as e:
        return f"HTTP error {e.response.status_code} when crawling {url}"
    except httpx.RequestError as e:
        return f"Request failed for {url}: {e}"
    except Exception as e:
        return f"Failed to crawl {url}: {e}"
