"""Test the provider test endpoint with a real Gemini API key."""
import os, sys, asyncio
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_provider.db"
os.environ["CEREBRA_API_KEY"] = ""
sys.path.insert(0, ".")

from httpx import AsyncClient, ASGITransport
from app.main import app

async def test():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        # Test Gemini
        r = await c.post("/providers/test", json={
            "base_url": "https://generativelanguage.googleapis.com/v1beta",
            "api_key": "AIzaSyBPuz7agBbTvosZ2Qcvohkp6AnLgAJM_70",
            "provider_type": "gemini",
        })
        data = r.json()
        print(f"Gemini: {r.status_code}")
        if r.status_code == 200:
            print(f"  Models: {data['models'][:5]}")
        else:
            print(f"  Error: {data}")

        # Test with wrong key
        r = await c.post("/providers/test", json={
            "base_url": "https://generativelanguage.googleapis.com/v1beta",
            "api_key": "bad-key",
            "provider_type": "gemini",
        })
        print(f"Bad key: {r.status_code} - {r.json().get('detail', '')[:100]}")

        # Test missing base_url
        r = await c.post("/providers/test", json={
            "base_url": "",
            "api_key": "test",
            "provider_type": "openai",
        })
        print(f"No URL: {r.status_code} - {r.json().get('detail', '')[:100]}")

asyncio.run(test())

if os.path.exists("test_provider.db"):
    os.remove("test_provider.db")
