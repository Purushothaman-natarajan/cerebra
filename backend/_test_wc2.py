import asyncio
from app.runtime.tools.web_crawler import web_crawler

async def test():
    result = await web_crawler("https://en.wikipedia.org/wiki/Artificial_intelligence")
    print(f"Wikipedia: {result[:400]}")
    print()
    result = await web_crawler("https://example.com")
    print(f"example.com: {result[:400]}")
    print()
    result = await web_crawler("not-a-valid-url")
    print(f"Invalid: {result[:400]}")

asyncio.run(test())
