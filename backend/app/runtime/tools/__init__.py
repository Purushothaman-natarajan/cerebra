# Import each tool module. Each import triggers @register decorators that
# populate the tool registry. Wrapped individually so a missing dependency
# (e.g. bs4, httpx) in one tool doesn't prevent others from loading.
import logging

_log = logging.getLogger(__name__)

_TOOL_MODULES = [
    "app.runtime.tools.calculator",
    "app.runtime.tools.web_search",
    "app.runtime.tools.http_request",
    "app.runtime.tools.web_crawler",
    "app.runtime.tools.current_time",
    "app.runtime.tools.random_number",
    "app.runtime.tools.text_analyzer",
    "app.runtime.tools.json_tool",
    "app.runtime.tools.url_info",
    "app.runtime.tools.circl_cve",
    "app.runtime.tools.code_interpreter",
    "app.runtime.tools.qdrant_tool",
]

import importlib
for _mod_name in _TOOL_MODULES:
    try:
        importlib.import_module(_mod_name)
    except Exception as _exc:
        _log.warning("Tool module %s failed to load: %s", _mod_name, _exc)

from app.runtime.tools.registry import get_tool, get_tool_definitions, list_tools

__all__ = ["get_tool", "get_tool_definitions", "list_tools"]
