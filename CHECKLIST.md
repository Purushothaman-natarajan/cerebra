# Project Checklist

> Consolidated tracker of all bugs found, fixed, and remaining work items.

---

## Status

| Metric | Value |
|--------|-------|
| Backend tests | **15 pass**, 4 skip (need GEMINI_API_KEY) |
| Frontend build | **0 TypeScript errors**, clean |
| API endpoints | **12/12 respond correctly** |
| Total items | **42 fixed ✓**, **5 remaining** |

---

## All Fixed Items ✓

### Infrastructure & Scaffold
- [x] Docker Compose (postgres, redis, backend, frontend)
- [x] FastAPI skeleton + health check
- [x] React + Vite + shadcn/ui scaffold
- [x] `.env.example`, `Makefile`, `run.bat`/`.ps1`/`.sh`, `pyproject.toml` for uv
- [x] nginx config with SPA fallback + API/WS proxy + security headers
- [x] `.dockerignore` for backend + frontend
- [x] Docker healthcheck for backend
- [x] `--reload` removed from production Dockerfile

### Backend — Models & API
- [x] SQLAlchemy models: Agent, WorkflowDef, Run, RunEvent, Channel, ChannelMessage, LLMProvider, CustomTool
- [x] Agents CRUD endpoints + service
- [x] Workflows CRUD endpoints + service
- [x] Runs CRUD + trigger + event history endpoints
- [x] Templates listing endpoint (reads `templates/*.json`)
- [x] Providers CRUD with encryption + presets
- [x] Tools CRUD (built-in + custom merge)
- [x] Channels CRUD + Telegram webhook
- [x] WebSocket endpoint `/ws/runs/{run_id}`

### Backend — Runtime
- [x] LangGraph compiler (WorkflowDef → CompiledGraph)
- [x] Executor with Redis event streaming
- [x] Agent node (LLM + tool call loop + guardrails)
- [x] Router node (keyword-based conditional routing)
- [x] Tool registry (decorator-based): calculator, web_search, web_crawler, http_request
- [x] Gemini LLM wrapper (async via `client.aio`)

### Backend — Security
- [x] **C1**: AST-based safe eval in calculator (no `eval()`)
- [x] **C2**: try/except around `run_workflow()` — sets "failed" status
- [x] **C3**: null check for pubsub in WebSocket
- [x] **C4**: Configurable CORS origins via env var
- [x] **M11**: SSRF private IP blocklist on http_request
- [x] **H6**: DNS resolution before private IP check (async getaddrinfo)
- [x] **S1**: Provider API keys encrypted with Fernet at rest
- [x] **S2**: Bearer token auth middleware + WebSocket token param
- [x] **S3**: async DNS resolution in http_request to fix SSRF bypass
- [x] **S4**: In-memory rate limiting (10/min on /runs, 100/min others)
- [x] **S5**: nginx security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [x] **S8**: HTTPS config block in nginx (commented, ready)
- [x] **S9**: Redis password support via REDIS_PASSWORD env var
- [x] **S10**: Sanitized calculator error messages
- [x] **S11**: WebSocket origin validation
- [x] **S12**: Updated `.gitignore` (logs, secrets, keys, env.local)
- [x] **S14**: Input length limits via Pydantic Field validators + 5MB request body middleware
- [x] **B1**: Graceful DB startup when Postgres unavailable
- [x] **B4**: Auth middleware returns Response instead of raising HTTPException
- [x] Inline imports moved to top in `channels.py`
- [x] Docker-compose uses env vars for Postgres creds

### Backend — Bug Fixes
- [x] **B2**: Router condition routing fixed (compares `_next` against edge condition)
- [x] **B3**: `nulls_first()` typo fixed
- [x] **m6**: `channel_id` nullable in ChannelMessage model
- [x] **m9**: Per-run Redis channels instead of global filter
- [x] **m10**: asyncpg pool size configurable via env
- [x] **m15**: Agent node iteration limit fallback message
- [x] `run_service.py`: `nullsfirst()` → `nulls_first()`
- [x] `llm.py`: `generate_content()` → `await client.aio.models.generate_content()`

### Frontend — Pages & Components
- [x] Renamed to **🌸 Orchid**
- [x] Reordered sidebar: Providers → Tools → Agents → Workflows → Channels → Runs → Settings
- [x] Responsive sidebar with hamburger toggle
- [x] Theme system: CSS vars, dark/light/system toggle, 6 accent colors
- [x] Component kit: cn(), Button, Input, Select, Textarea, Card, Badge, Dialog, Toast, Skeleton, Empty
- [x] **Dashboard**: Stats cards, quick actions, recent runs, onboarding banner
- [x] **Providers**: List with model list + masked key + Verified badge, Add drawer with Test Connection
- [x] **Tools**: Grid layout with icons, "Create custom tool" card
- [x] **Agents**: Emoji avatars, model badge, memory indicator, redesigned cards
- [x] **Workflows**: List cards with run/duplicate/delete, template picker with 3-step wizard
- [x] **Runs**: Filterable list, detail view with Live Log + Event Trace + Cost tracker
- [x] **Channels**: 3-step Telegram wizard (create bot, configure webhook, route messages)
- [x] **Settings**: General, Execution defaults, Notifications, Danger zone
- [x] Error boundaries on every page
- [x] Toast notifications replacing `alert()` everywhere
- [x] `apiFetch()` with auth header auto-attach
- [x] React Query: retry=1, refetchOnWindowFocus=false, staleTime=30s
- [x] Empty states on all pages
- [x] Keyboard shortcut: Ctrl+N for new agent
- [x] `web_crawler` in tool list
- [x] Dynamic model dropdown from providers
- [x] Dynamic tool selector (built-in + custom)
- [x] Vite proxy: consistent `/api` prefix

### Frontend — Removed Dead Code
- [x] Removed `TokenChart.tsx` (backend never emits token data)
- [x] Removed `useRunStore` (RunsPage uses local state)

### Tests
- [x] Agent CRUD tests (6 tests)
- [x] Workflow CRUD tests (5 tests)
- [x] Workflow compile tests (linear, conditional, loop)
- [x] Router decision unit test
- [x] Multi-agent test (skips without API key)
- [x] Comprehensive `test_all_endpoints.py` (TestClient against every route)

---

## Remaining Items

| Priority | Item | Notes |
|----------|------|-------|
| Low | Initial Alembic migration | Currently uses `create_all` on startup |
| Low | Fragile DuckDuckGo web_search | Uses undocumented lite endpoint |
| Low | Frontend @/ path alias unused | tsconfig has it, never imported |
| Low | No frontend test framework (vitest) | Only backend has tests |
| Low | Canvas stale closure | `handleNodesChange` uses setTimeout with potentially stale state |

---

## Bug History

| Bug | Severity | Status | Detail |
|-----|----------|--------|--------|
| B1 — Crash without Postgres | Critical | ✅ Fixed | `main.py` lifespan wrapped in try/except |
| B2 — Router condition routing | Critical | ✅ Fixed | Compares `_next` against edge condition name |
| B3 — `nulls_first()` typo | High | ✅ Fixed | `nullsfirst()` → `nulls_first()` |
| B4 — Auth middleware traceback | Medium | ✅ Fixed | Returns JSONResponse instead of raising HTTPException |
| B5 — Test commit behavior | Low | Noted | Test infra, not production |
| B6 — Channel ID null | Low | ✅ Fixed | Previous round |
| B7 — ChannelsPage missing auth | Medium | ✅ Fixed | Uses `apiFetch()` now |
