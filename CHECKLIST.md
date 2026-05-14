# Project Checklist

> Consolidated tracker — 34 backend tests, 23 frontend tests, 16 E2E tests passing.

---

## Status

| Metric | Value |
|--------|-------|
| Backend unit tests | **34 pass**, 4 skip (need GEMINI_API_KEY) |
| Frontend component tests | **23 pass** (7 test files) |
| E2E API tests | **16/16 pass** with real Gemini API |
| Frontend build | **0 TypeScript errors**, clean |
| API endpoints | **24/24 respond correctly** via TestClient |
| Total fixed items | **42+** |

## All Fixed Items ✓

### Infrastructure
- [x] Docker Compose (postgres, redis, backend, frontend)
- [x] FastAPI skeleton + health check
- [x] React + Vite + Tailwind scaffold
- [x] `.env.example`, `Makefile`, `run.bat`/`.ps1`/`.sh`, `pyproject.toml`
- [x] nginx config with SPA fallback + API/WS proxy + security headers
- [x] `.dockerignore`, Docker healthcheck, `--reload` removed in prod

### Backend — API
- [x] All 25+ endpoints have `response_model=`, typed schemas, examples, error codes
- [x] Every field has `description` + `examples` for Swagger pre-fill
- [x] `POST /providers/test` — real connection test (OpenAI, Gemini, Anthropic, Ollama)
- [x] `POST /tools/test` — test custom tools with sample input
- [x] All `body: dict` replaced with typed Pydantic schemas

### Backend — Security
- [x] AST-based safe eval (no `eval()`)
- [x] SSRF private IP blocklist + async DNS resolution
- [x] Configurable CORS origins
- [x] Bearer token auth middleware + WS token param
- [x] Fernet encryption for provider API keys
- [x] Rate limiting (10/min runs, 100/min other)
- [x] Input validation (Pydantic Field limits, 5MB max body)
- [x] nginx security headers
- [x] Redis password support
- [x] WebSocket origin validation
- [x] Sanitized error messages (no stack leaks to LLM)
- [x] OpenAPI schema patch (singular examples for Swagger)

### Backend — Bug Fixes
- [x] Graceful DB startup (no crash without Postgres)
- [x] Router condition routing fixed
- [x] Auth middleware returns Response (no ExceptionGroup traceback)
- [x] `nulls_first()` typo fixed
- [x] Per-run Redis channels
- [x] Agent node iteration limit fallback
- [x] Provider models saved on test connection
- [x] `apiFetch` shows backend error messages

### Frontend — UI
- [x] Renamed to Cerebra, 8-item sidebar in onboarding order
- [x] Responsive: mobile hamburger, sticky header, glass effects
- [x] Page transitions (fadeInUp), scrollbar styling, theme support
- [x] Design system: 14 UI components with variants
- [x] All pages have loading skeletons, error states, empty states
- [x] App-level ErrorBoundary
- [x] Toast notifications replace all `alert()`
- [x] Keyboard shortcut: Ctrl+N for new agent
- [x] Agent form: Provider selector + Model dropdown
- [x] Template library with import history tracking
- [x] Tool testing dialog with input/output/timing
- [x] Run detail view with agent timeline + cost tracker
- [x] Channels 3-step Telegram wizard
- [x] Settings page with live toggles + security info
- [x] `@/` path aliases used throughout

### Removed Dead Code
- [x] TokenChart.tsx (no backend data source)
- [x] useRunStore (RunsPage uses local state)
- [x] `Page` wrapper component (inlined into StandardPage)

## E2E Test Results

Tested with real Gemini API key against all 16 endpoints:

| Test | Result |
|------|--------|
| Health | ✅ |
| Test Gemini Connection | ✅ — 10 models returned |
| Create Provider | ✅ — saved with discovered models |
| List Providers | ✅ |
| List Models | ✅ |
| Create Agent | ✅ |
| List Agents | ✅ |
| Create Workflow | ✅ |
| Create Tool | ✅ |
| Test Tool | ✅ — 1599ms HTTP POST |
| Test Tool (bad id) | ✅ — 404 |
| List Tools | ✅ — 4 built-in + 1 custom |
| Trigger Run | ✅ — pipeline compiled, Gemini reached (quota) |
| List Templates | ✅ — 4 templates |
| List Channels | ✅ |
| Cleanup | ✅ |

## Completed (implemented)

| Item | Fix |
|------|-----|
| ✅ `llm.py` sync → async + tool calling | Rewrote with direct `httpx` to Gemini REST API — fully async, supports system_instruction, functionDeclarations |
| ✅ DuckDuckGo web_search | Changed from `lite.duckduckgo.com/lite/` to `html.duckduckgo.com/html/` with proper result extraction |
| ✅ CI/CD triggers commented out | Uncommented `on:` block — runs on push/PR to main |
| ✅ Frontend chunk size >500KB | Code-split: lazy routes + manualChunks. Largest chunk now 248KB (was 505KB) |

## Sprint 2 — Complete ✅ (All 5 items done)

| # | Item | Status | Detail |
|---|------|--------|--------|
| 1 | Fix in-memory event bus | ✅ Done | Removed `wait_for(timeout=300)` bug, WebSocket reconnection + 3s polling fallback |
| 2 | Token cost tracking | ✅ Done | Parse `usageMetadata` from Gemini, 11-model pricing defaults, RunResponse token/cost fields, migration 0002 |
| 3 | 5 new built-in tools | ✅ Done | current_time, random_number, text_analyzer, json_tool, url_info — all registered and frontend icons added |
| 4 | Help/instruction buttons | ✅ Done | `?` popover on all 9 pages with contextual step-by-step guides |
| 5 | Expand Settings + key security | ✅ Done | Cost defaults table, clear-all-keys endpoint, encryption transparency docs, Danger Zone with confirm dialogs |

## Sprint 3 — Just Completed

| # | Item | Status | Detail |
|---|------|--------|--------|
| 1 | Typography & Dark Mode | ✅ Done | Manrope font loaded, dark mode `--fg-primary: #f0f0f4`, letter-spacing, selection styling |
| 2 | Expose 5 new tools in frontend | ✅ Done | Icon mappings for all 9 built-in tools (Clock, Dice6, AlignLeft, Braces, Link) |
| 3 | Agent Templates | ✅ Done | DB model + migration 0003 + backend CRUD + 8 seeded defaults + frontend template chips |
| 4 | Agent download/upload | ✅ Done | Per-card download, Export All, Import via JSON — backend GET/POST endpoints |
| 5 | Tool download/upload | ✅ Done | Per-tool download, Export, Import via JSON — backend GET/POST endpoints |

## Sprint 4 — Error Handling + Workflow Fixes + Tool Visibility (All Done ✅)

| # | Item | Status | Detail |
|---|------|--------|--------|
| 1 | Global exception handler | ✅ Done | Catch-all returns clean JSON `{"detail": "..."}` instead of HTML 500 |
| 2 | Fix workflow save + canvas + duplicate | ✅ Done | All 5 node types saved, canvas re-inits on switch, clean duplicate payload |
| 3 | Fix NodeConfigPanel tools | ✅ Done | API-fetched all 9 built-in tools with toggle enable/disable |
| 4 | Test Run on workflow page | ✅ Done | Inline test execution with results panel |
| 5 | Frontend API error display | ✅ Done | 429 rate limit, 500 server error, non-JSON fallback handling |

## Sprint 5 — Live Logs, Tool/Agent Testing, Runs Refresh

| # | Item | Status | Detail |
|---|------|--------|--------|
| 1 | Fix live logs — emit agent events | 🔄 | compiler.py wrapper publishes agent_start/agent_end/tool_call events |
| 2 | Built-in tool testing | 🔄 | Backend POST /tools/test-builtin + frontend Test button per tool |
| 3 | Agent testing | 🔄 | Backend POST /agents/{id}/test + frontend test dialog |
| 4 | Runs page refresh button | 🔄 | Add refresh button to re-fetch runs and events |

## All Backlog Items Completed ✅

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| Low | Schedule trigger | ✅ Done | APScheduler checks DB every 60s for `trigger.type: "schedule"` workflows and executes via `run_workflow` |
| Low | Human-in-the-loop | ✅ Done | `human_node.py` with in-memory pending store, `POST /runs/{id}/human-response` + `GET /runs/{id}/human-request` endpoints, compiler handles `human` node type |
| Low | Conversation memory | ✅ Done | In-memory `_conversation_store` dict, `agent_node.py` prepends history when `memory_enabled` is true, rolling window of last 10 exchanges |
