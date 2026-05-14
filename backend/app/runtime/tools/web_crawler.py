import json
import re
from typing import Any
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from app.runtime.tools.registry import register


def _parse_input(payload: str, max_chars: int) -> dict[str, Any]:
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        data = {"url": payload}

    if not isinstance(data, dict):
        data = {"url": str(payload)}

    return {
        "url": str(data.get("url", "")).strip(),
        "max_chars": int(data.get("max_chars", max_chars) or max_chars),
        "css_selector": data.get("css_selector"),
        "wait_for": data.get("wait_for"),
        "js_code": data.get("js_code"),
        "word_count_threshold": int(data.get("word_count_threshold", 10) or 10),
        "only_text": bool(data.get("only_text", False)),
    }


def _valid_external_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def _trim_content(content: str, max_chars: int) -> str:
    if len(content) <= max_chars:
        return content
    return content[:max_chars] + "\n\n[Content truncated...]"


async def _crawl_with_crawl4ai(options: dict[str, Any]) -> str:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig

    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        user_agent="Mozilla/5.0 (compatible; Cerebra-AI/1.0)",
    )
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        css_selector=options["css_selector"],
        wait_for=options["wait_for"],
        js_code=options["js_code"],
        word_count_threshold=options["word_count_threshold"],
        remove_overlay_elements=True,
        process_iframes=True,
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url=options["url"], config=run_config)

    if not getattr(result, "success", False):
        return f"Failed to crawl {options['url']}: {getattr(result, 'error_message', '')}".strip()

    markdown = getattr(result, "markdown", "") or ""
    if not isinstance(markdown, str):
        markdown = getattr(markdown, "fit_markdown", "") or getattr(markdown, "raw_markdown", "") or str(markdown)

    content = markdown or getattr(result, "cleaned_html", "") or getattr(result, "html", "")
    if options["only_text"]:
        content = BeautifulSoup(content, "html.parser").get_text(separator="\n", strip=True)
    return _trim_content(content.strip(), options["max_chars"]) or f"No crawlable content found for {options['url']}"


async def _crawl_with_bs4(url: str, max_chars: int) -> str:
    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; Cerebra-AI/1.0)"})
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form", "iframe"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    body = soup.find("main") or soup.find("article") or soup.find("body") or soup

    text = body.get_text(separator="\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    content = "\n".join(lines)

    if title:
        content = f"# {title}\n\n{content}"

    return _trim_content(content, max_chars)


@register("web_crawler")
async def web_crawler(payload: str, max_chars: int = 5000) -> str:
    """Advanced Crawl4AI web crawler. Input: URL or JSON {url, css_selector, wait_for, js_code, max_chars}. Output: clean markdown page content."""
    options = _parse_input(payload, max_chars)
    url = options["url"]
    if not _valid_external_url(url):
        return f"Failed to crawl {url or payload}"

    try:
        return await _crawl_with_crawl4ai(options)
    except ImportError:
        try:
            return await _crawl_with_bs4(url, options["max_chars"])
        except Exception:
            return f"Failed to crawl {url}"
    except Exception:
        try:
            return await _crawl_with_bs4(url, options["max_chars"])
        except Exception:
            return f"Failed to crawl {url}"
