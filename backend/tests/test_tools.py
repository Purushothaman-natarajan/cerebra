"""Tests for built-in tools: calculator, web_crawler, http_request security."""

import pytest
from app.runtime.tools.registry import get_tool_definitions, get_tool, list_tools


def test_tool_registry_has_all_builtins():
    names = list_tools()
    for expected in ("calculator", "web_search", "http_request", "web_crawler"):
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
async def test_web_search_error_sanitized():
    """Error messages should not leak internals."""
    from app.runtime.tools.web_search import web_search
    result = await web_search("")
    assert "Error" not in result or "Search failed" in result
