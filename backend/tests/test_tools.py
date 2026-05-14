"""Tests for built-in tools: calculator, web_crawler, http_request security."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.db import get_db
from app.main import app
from app.runtime.tools.registry import get_tool_definitions, get_tool, list_tools


def test_tool_registry_has_all_builtins():
    names = list_tools()
    for expected in ("calculator", "web_search", "http_request", "web_crawler", "circl_cve", "code_interpreter"):
        assert expected in names, f"Missing tool: {expected}"


def test_tool_definitions_have_descriptions():
    for t in get_tool_definitions():
        assert t["name"], f"Tool missing name"
        assert t["description"], f"Tool {t['name']} missing description"


@pytest.mark.asyncio
async def test_calculator_addition():
    from app.runtime.tools.calculator import calculator
    result = await calculator("2 + 2")
    assert result == "4"


@pytest.mark.asyncio
async def test_calculator_complex():
    from app.runtime.tools.calculator import calculator
    result = await calculator("(3 + 5) * 2")
    assert result == "16"


@pytest.mark.asyncio
async def test_calculator_division():
    from app.runtime.tools.calculator import calculator
    result = await calculator("10 / 2")
    assert result == "5.0"


@pytest.mark.asyncio
async def test_calculator_invalid_expression():
    from app.runtime.tools.calculator import calculator
    result = await calculator("not math")
    assert "Error" in result


@pytest.mark.asyncio
async def test_calculator_power():
    from app.runtime.tools.calculator import calculator
    result = await calculator("2 ** 10")
    assert result == "1024"


@pytest.mark.asyncio
async def test_calculator_mod():
    from app.runtime.tools.calculator import calculator
    result = await calculator("10 % 3")
    assert result == "1"


@pytest.mark.asyncio
async def test_http_request_ssrf_block():
    """Verify SSRF protection blocks private IPs."""
    from app.runtime.tools.http_request import http_request
    result = await http_request("http://localhost:8000/health")
    assert "not allowed" in result
    result2 = await http_request("http://127.0.0.1:8000/health")
    assert "not allowed" in result2
    result3 = await http_request("http://192.168.1.1:8000/health")
    assert "not allowed" in result3


@pytest.mark.asyncio
async def test_http_request_ssrf_block_private_dns():
    """Verify hostnames resolving to private IPs are blocked."""
    from app.runtime.tools.http_request import http_request
    result = await http_request("http://host.docker.internal:8000/health")
    assert "not allowed" in result


@pytest.mark.asyncio
async def test_web_crawler_invalid_url():
    from app.runtime.tools.web_crawler import web_crawler
    result = await web_crawler("not-a-valid-url")
    assert "Failed" in result


@pytest.mark.asyncio
async def test_tools_test_endpoint_runs_builtin_by_name(client):
    response = await client.post("/tools/test", json={"tool_id": "calculator", "input": "2 + 3"})
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["output"] == "5"


@pytest.mark.asyncio
async def test_tools_list_includes_new_builtins(client):
    response = await client.get("/tools")
    assert response.status_code == 200
    names = {tool["name"] for tool in response.json() if tool["is_builtin"]}
    assert {"circl_cve", "code_interpreter"}.issubset(names)


@pytest.mark.asyncio
async def test_tools_list_returns_builtins_when_custom_tool_db_unavailable():
    class BrokenSession:
        async def execute(self, *_args, **_kwargs):
            raise ConnectionError("database unavailable")

    async def override_db():
        yield BrokenSession()

    app.dependency_overrides[get_db] = override_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/tools")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    names = {tool["name"] for tool in response.json() if tool["is_builtin"]}
    assert {"calculator", "web_search", "web_crawler", "circl_cve", "code_interpreter"}.issubset(names)


@pytest.mark.asyncio
async def test_tools_test_endpoint_handles_every_builtin(client):
    samples = {
        "calculator": "2 + 3",
        "web_search": "",
        "http_request": "http://localhost:8000/health",
        "web_crawler": "not-a-valid-url",
        "current_time": "IST",
        "random_number": '{"min":1,"max":3,"count":2,"unique":true}',
        "text_analyzer": "The quick brown fox jumps over the lazy dog.",
        "json_tool": '{"action":"format","json":"{\\"name\\":\\"test\\"}"}',
        "url_info": "not-a-valid-url",
        "circl_cve": "not-a-cve",
        "code_interpreter": '{"code":"result = 2 + 3","input":""}',
    }

    for name in list_tools():
        response = await client.post("/tools/test", json={"tool_id": name, "input": samples[name]})
        assert response.status_code == 200, name
        data = response.json()
        assert "ok" in data, name
        assert isinstance(data["output"], str), name


@pytest.mark.asyncio
async def test_web_search_error_sanitized():
    """Error messages should not leak internals."""
    from app.runtime.tools.web_search import web_search
    result = await web_search("")
    assert "Error" not in result or "Search failed" in result
