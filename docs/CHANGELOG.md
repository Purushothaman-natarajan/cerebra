# Changelog

All notable changes to Cerebra-AI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-05-15

### Added
- **LLM call logging** — every LLM invocation now logs provider, model, timing, token counts (`llm_providers.py`)
- **Router node fix** — `_router_conditions` now properly populated from workflow edges; router node works correctly
- **Run cascade rules** — `runs.workflow_id` and `run_events.run_id` now have `ON DELETE CASCADE` foreign keys
- **Guardrails word-boundary matching** — topic blocking uses `\b` word boundaries instead of fragile substring matching
- **Encryption warning** — warning log emitted when `ENCRYPTION_KEY` is not configured (prevents silent plaintext storage)
- **DNS timeout** — `_is_private_url` in `http_request.py` and `web_crawler.py` now has 5-second DNS resolution timeout
- **Custom tool sandbox fix** — `exec()` in `tools.py` now uses restricted builtins (same as `code_interpreter.py`)
- **WebSocket origin validation** — now reads allowed origins from `settings.cors_origin_list()` (configurable via `CORS_ORIGINS`)
- **OpenAI tool_call_id** — tool role messages now include `tool_call_id` for proper function call correlation
- **Anthropic content blocks** — tool results use proper Anthropic `tool_result` content block format
- **Log model indexes** — `logs.run_id` and `logs.timestamp` now have indexes for query performance
- **Workflow validation** — `trigger_run` now validates workflow has nodes before execution (clear error message)

### Fixed
- `runs.py:92` — `wf.nodes[0]["id"]` crash on empty workflow (now returns 400 with helpful message)
- `router_node.py` — `_router_conditions` was never populated, router always returned "default"
- `ws.py` — origin check now uses configurable `CORS_ORIGINS` instead of hardcoded list
- `web_crawler.py` — fallback BS4 crawler had no SSRF protection (now uses same private IP check as http_request)
- `tools.py:130` — `exec()` with full `__builtins__` was a security vulnerability (now sandboxed)
- `llm_providers.py:111` — OpenAI tool messages missing `tool_call_id` (caused API errors)
- `llm_providers.py:246` — Anthropic adapter used wrong format for tool results (now uses content blocks)
- `agent_service.py:132-134` — guardrails substring matching caused false positives (now word-boundary)

## [0.2.0] - 2026-05-15

### Added
- **Provider-aware LLM routing** (`llm_providers.py`): model names are now matched to configured providers in the DB. Supports OpenAI-compatible (OpenAI, OpenRouter, Ollama, custom), Gemini, and Anthropic adapters, with automatic fallback to GEMINI_API_KEY for unknown models.
- Structured logging with JSON output format and request ID correlation
- Request ID middleware for end-to-end traceability
- Enhanced health check endpoint with database dependency status
- Configurable log level and service name via environment variables
- Proper PBKDF2 salt derivation (key-based, not hardcoded)
- Exponential backoff for Redis reconnection
- Encryption key validation (minimum 16 characters)
- Database URL validation (must use asyncpg or aiosqlite driver)
- Comprehensive API documentation (API_DOCS.md)
- Architecture documentation (ARCHITECTURE.md)
- Frontend log ingest pipeline (POST /api/logs, DB persistence, event bus publish)
- GET /api/logs endpoint with run_id and time range filtering
- Built-in tool icons and sample inputs for qdrant_index and qdrant_search
- 13 built-in tools including conditional qdrant registration

### Changed
- Renamed `class Config` to `model_config = SettingsConfigDict(...)` in Settings (Pydantic v2)
- Updated .env.example with detailed descriptions and new fields (LOG_LEVEL, SERVICE_NAME)
- bus.py: retry delay resets on successful connection, added JSON serialization fallback
- security.py: PBKDF2 iterations increased from 600K to 1M (OWASP 2024 recommendation)
- executor.py: validates workflow structure before compilation; agent_node.py returns friendly error when model is empty
- agent_template_service.py: all templates use empty string model (rely on providers)
- Agent and AgentTemplate ORM models default model to empty string

### Fixed
- Dialog focus steal: input textarea no longer loses focus after typing 1 character
- Run workflow Internal Server Error: validates empty workflows before LangGraph compilation
- Tools list now returns `tool_id` for both built-in (name) and custom (UUID) tools
- Timestamp display: create_run() sets started_at immediately; frontend shows local timezone
- Hardcoded "gemini-2.0-flash" model defaults removed from agent templates
- agent_service.test_agent() returns error when model is not set

### Known Issues
- LLM runtime only supports Gemini (provider-aware routing not yet implemented)
- In-memory rate limiter does not work across multiple backend instances
- Conversation memory is in-process only (lost on restart)
- Alembic migrations exist but are not run automatically on startup

## [0.1.0] - 2026-04-20

### Added
- Initial release: multi-agent workflow orchestration platform
- Visual workflow canvas (ReactFlow) with 5 node types
- Agent builder with provider-driven model selection
- Custom tool builder (HTTP, Python, Webhook)
- 13 built-in tools (web_search, calculator, http_request, etc.)
- 10 agent templates (Research, Writing, Analysis, etc.)
- 4 workflow templates (import via Templates page)
- LangGraph-based workflow executor with event streaming
- Telegram channel integration
- Run history with event trace, agent timeline, cost tracking
- Provider management with encrypted API keys
- Theme system (light/dark + 6 accent colors)
- Authentication middleware (Bearer token)
- Rate limiting (in-memory sliding window)
- SSRF protection for http_request tool
- AST-based safe calculator evaluation
- Docker Compose deployment
- GitHub Actions CI/CD pipeline
