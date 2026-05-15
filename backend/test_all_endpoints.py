"""Comprehensive API endpoint test using FastAPI TestClient (no subprocess, no port)."""
import os
import sys

# NOTE: set test-specific envvars inside the run_tests function so importing this
# module does not mutate the global environment for other tests.

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db import Base, get_db
from app.main import app

Bugs = []

def report(cat, endpoint, status, expected, detail=""):
    Bugs.append({"cat": cat, "endpoint": endpoint, "status": status, "expected": expected, "detail": detail})

def ok(msg): print(f"  PASS {msg}")
def fail(msg): print(f"  FAIL {msg}")

import asyncio

async def run_tests():
    # Force SQLite for testing and ensure auth not required during these checks
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_endpoints.db"
    os.environ["CEREBRA_API_KEY"] = ""
    # Use SQLite engine for tests
    engine = create_async_engine("sqlite+aiosqlite:///./test_endpoints.db", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_db():
        async with session_factory() as s:
            try:
                yield s
                await s.commit()
            except Exception:
                await s.rollback()
                raise
            finally:
                await s.close()

    app.dependency_overrides[get_db] = override_db
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("=== Testing All Endpoints ===\n")

        # Health
        r = await client.get("/health")
        ok("GET /health") if r.status_code == 200 else report("CRITICAL", "GET /health", r.status_code, 200)

        # Templates
        r = await client.get("/templates")
        if r.status_code == 200:
            data = r.json()
            if len(data) == 3: ok(f"GET /templates -> {len(data)} templates")
            else: report("BUG", "GET /templates count", len(data), 3)
        else: report("CRITICAL", "GET /templates", r.status_code, 200)

        # Agents CRUD
        r = await client.post("/agents", json={"name": "Test Agent", "role": "r1", "system_prompt": "p1"})
        if r.status_code == 201:
            aid = r.json()["id"]; ok(f"POST /agents -> {aid}")
            r = await client.get(f"/agents/{aid}")
            ok(f"GET /agents/{aid}") if r.status_code == 200 else report("CRITICAL", "GET agent", r.status_code, 200)
            r = await client.patch(f"/agents/{aid}", json={"name": "Updated"})
            if r.status_code == 200 and r.json().get("name") == "Updated": ok(f"PATCH /agents/{aid}")
            else: report("BUG", "PATCH agent", r.json().get("name"), "Updated")
            r = await client.delete(f"/agents/{aid}")
            ok(f"DELETE /agents/{aid}") if r.status_code == 200 else report("BUG", "DELETE agent", r.status_code, 200)
        else: report("CRITICAL", "POST /agents", r.status_code, 201)

        # Workflows CRUD
        r = await client.post("/workflows", json={"name": "Test WF", "nodes": [], "edges": []})
        if r.status_code == 201:
            wid = r.json()["id"]; ok(f"POST /workflows -> {wid}")
            r = await client.patch(f"/workflows/{wid}", json={"name": "Updated WF"})
            if r.status_code == 200 and r.json().get("name") == "Updated WF": ok(f"PATCH /workflows/{wid}")
            else: report("BUG", "PATCH workflow", r.json().get("name"), "Updated WF")
            r = await client.delete(f"/workflows/{wid}")
            ok(f"DELETE /workflows/{wid}") if r.status_code == 200 else report("BUG", "DEL workflow", r.status_code, 200)
        else: report("CRITICAL", "POST /workflows", r.status_code, 201)

        # Providers CRUD + encryption
        r = await client.post("/providers", json={"name": "Test Provider", "provider_type": "openai", "base_url": "https://api.openai.com/v1", "api_key": "sk-test123456789"})
        if r.status_code == 201:
            pid = r.json()["id"]; ok(f"POST /providers -> {pid}")
            key = r.json().get("api_key", "")
            if key and "..." not in key:
                report("BUG", "POST providers key mask", key, "masked", "Key not masked in response")
            else: ok("POST /providers key masked")
            r = await client.get("/providers")
            if r.status_code == 200:
                for p in r.json():
                    pk = p.get("api_key", "")
                    if pk and "..." not in pk and len(pk) > 8:
                        report("BUG", "GET providers key mask", pk, "masked", f"Key not masked: {p['name']}")
                ok(f"GET /providers -> {len(r.json())} providers (keys checked)")
            r = await client.get("/providers/presets")
            ok(f"GET /providers/presets -> {len(r.json())} presets") if r.status_code == 200 else report("BUG", "presets", r.status_code, 200)
            r = await client.get("/providers/models")
            ok(f"GET /providers/models") if r.status_code == 200 else report("BUG", "models", r.status_code, 200)
            r = await client.delete(f"/providers/{pid}")
            ok(f"DELETE /providers/{pid}") if r.status_code == 200 else report("BUG", "DEL provider", r.status_code, 200)
        else: report("CRITICAL", "POST /providers", r.status_code, 201)

        # Tools CRUD
        r = await client.get("/tools")
        if r.status_code == 200:
            data = r.json()
            builtins = {t["name"] for t in data if t.get("is_builtin")}
            expected = {"web_search", "calculator", "http_request", "web_crawler"}
            missing = expected - builtins
            if missing: report("BUG", "GET /tools builtins", builtins, expected, f"Missing: {missing}")
            else: ok(f"GET /tools -> {len(data)} tools ({len(builtins)} builtins)")
        else: report("CRITICAL", "GET /tools", r.status_code, 200)

        r = await client.post("/tools", json={"name": "my_tool", "description": "test", "tool_type": "http", "config": {"url": "https://x.com"}})
        if r.status_code == 201:
            tid = r.json()["id"]; ok(f"POST /tools -> {tid}")
            r = await client.delete(f"/tools/{tid}")
            ok(f"DELETE /tools/{tid}") if r.status_code == 200 else report("BUG", "DEL tool", r.status_code, 200)
        else: report("BUG", "POST /tools", r.status_code, 201, f"{r.json()}")

        # Channels
        r = await client.post("/channels", json={"name": "Test TG", "type": "telegram", "config": {}})
        ok(f"POST /channels") if r.status_code == 201 else report("BUG", "POST channels", r.status_code, 201)
        r = await client.get("/channels")
        ok(f"GET /channels -> {len(r.json())} channels") if r.status_code == 200 else report("BUG", "GET channels", r.status_code, 200)

        # Runs - bad workflow_id
        r = await client.post("/runs", json={"workflow_id": "00000000-0000-0000-0000-000000000000", "input": "hi"})
        ok(f"POST /runs bad wf -> 404") if r.status_code == 404 else report("BUG", "POST runs bad wf", r.status_code, 404)

        # Auth enforcement
        import app.config as cfg
        cfg.settings.cerebra_api_key = "test-key-123"
        r = await client.get("/agents")
        if r.status_code == 401: ok("Auth enforced without key -> 401")
        else: report("BUG", "GET agents no auth", r.status_code, 401)
        r = await client.get("/agents", headers={"Authorization": "Bearer test-key-123"})
        ok("Auth with valid key -> 200") if r.status_code == 200 else report("BUG", "GET agents valid key", r.status_code, 200)
        cfg.settings.cerebra_api_key = ""

    # Report
    print(f"\n=== Bug Report ===")
    if Bugs:
        print(f"\n{len(Bugs)} issue(s) found:\n")
        for b in Bugs:
            print(f"  [{b['cat']}] {b['endpoint']}")
            print(f"    Expected: {b['expected']}, Got: {b['status']}")
            if b['detail']: print(f"    Detail: {b['detail']}")
            print()
    else:
        print("  No bugs found. All endpoints pass!")

    await engine.dispose()
    if os.path.exists("test_endpoints.db"): os.remove("test_endpoints.db")
    print("Done.")

if __name__ == "__main__":
    asyncio.run(run_tests())
