"""URL info tool — fetch metadata (title, description, etc.) from a URL."""

import re
import httpx
from bs4 import BeautifulSoup
from app.runtime.tools.registry import register


@register("url_info")
async def url_info(url: str) -> str:
    """Fetch metadata from a URL. Input: full URL starting with http(s)://. Output: page title, description, and basic metadata."""
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        return "Error: URL must start with http:// or https://"

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            resp = await client.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; Cerebra-AI/1.0)"},
            )
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else "No title"
        desc_meta = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        description = desc_meta.get("content", "").strip() if desc_meta else ""
        og_title = soup.find("meta", attrs={"property": "og:title"})
        og_title = og_title.get("content", "").strip() if og_title else ""

        lines = [f"URL: {url}", f"Title: {og_title or title}"]
        if description:
            lines.append(f"Description: {description[:500]}")

        content_type = resp.headers.get("content-type", "unknown")
        content_length = resp.headers.get("content-length", "unknown")
        lines.append(f"Type: {content_type}")
        if content_length.isdigit():
            size_kb = round(int(content_length) / 1024, 1)
            lines.append(f"Size: {size_kb} KB")
        text = soup.get_text(separator=" ", strip=True)
        words = len(text.split())
        lines.append(f"Words on page: {words}")

        return "\n".join(lines)
    except httpx.HTTPStatusError as e:
        return f"Error: HTTP {e.response.status_code} for {url}"
    except httpx.RequestError:
        return f"Error: Could not reach {url}"
    except Exception:
        return f"Error: Failed to fetch {url}"
