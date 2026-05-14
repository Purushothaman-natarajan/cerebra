# Cerebra‑AI — Architecture

## System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    React Frontend (9 pages)                       │
│  AgentBuilder │ WorkflowCanvas (ReactFlow) │ MonitorPanel        │
│  Providers, Templates, Tools, Agents, Workflows, Runs, Channels  │
│  Settings, Dashboard                                              │
└─────────────────────────────┬────────────────────────────────────┘
                              │ REST + WebSocket (auth: Bearer token)
┌─────────────────────────────▼────────────────────────────────────┐
│                       FastAPI Backend                             │
│                                                                   │
│  Auth Middleware → Rate Limiter → Router → Service → LangGraph    │
│                                                                   │
│  Routes (/agents, /workflows, /runs, /templates, /providers,      │
│           /tools, /channels, /ws)                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Agent Runtime (LangGraph)                       │ │
│  │  WorkflowDef JSON → Compiler → CompiledGraph                 │ │
│  │  Nodes: Agent (LLM+tools), Router (conditions), Output       │ │
│  │  Guardrails: blocked topics, max tokens                       │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                      │
│  ┌─────────────────────────▼───────────────────────────────────┐ │
│  │              Redis pub/sub (per-run channels)                │ │
│  │  run:events:{run_id} → WebSocket → LiveLogs                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                 ┌────────────┴─────────────┐
                 │                          │
        ┌────────▼────────┐      ┌──────────▼──────────┐
        │   PostgreSQL     │      │   Telegram Bot       │
        │   (SQLite dev)   │      │   (webhook handler)  │
        │                  │      │                      │
        │  8 tables:       │      │  POST /channels/     │
        │  agents,         │      │  webhook/telegram    │
        │  workflow_defs,  │      └──────────────────────┘
        │  runs,           │
        │  run_events,     │
        │  channels,       │
        │  channel_messages│
        │  llm_providers,  │
        │  custom_tools    │
        └──────────────────┘
```

## Data Flow

1. **User triggers workflow** via UI (`POST /runs`) or Telegram webhook
2. **FastAPI** validates auth, looks up workflow, creates Run record
3. **Compiler** converts workflow JSON → LangGraph `StateGraph` with nodes and edges
4. **Executor** invokes `graph.ainvoke(initial_state)` — runs each node in sequence
5. **AgentNode** calls Gemini LLM with system prompt + message history + tool definitions
6. **Events** (run_start, agent_start, tool_call, agent_end, run_end) published to Redis
7. **WebSocket** clients subscribed to `run:events:{run_id}` receive real-time updates
8. **Run completes** — status set to `completed` or `failed`, events persisted to DB

## Auth Flow

```
Request → [CORS Middleware] → [Auth Middleware] → [Rate Limiter] → Router
                      │                            │
                  Checks Authorization         Sliding window counter
                  header against              per IP per path.
                  CEREBRA_API_KEY.             /runs: 10/min, other: 100/min
                  Public: /health, /docs,
                  /webhook/telegram.
```

## Security Layers

| Layer | Mechanism | File |
|-------|-----------|------|
| **Auth** | Bearer token middleware (`Authorization: Bearer <key>`) | `app/auth.py` |
| **WS Auth** | `?token=` query param on WebSocket connect | `app/auth.py` |
| **CORS** | Configurable origins via `CORS_ORIGINS` env var | `app/main.py` |
| **Rate Limit** | In-memory sliding window, body size check (5MB) | `app/ratelimit.py` |
| **Encryption** | Fernet (PBKDF2-SHA256, 600K iterations) for provider API keys | `app/security.py` |
| **SSRF** | DNS resolution before private IP blocklist check | `runtime/tools/http_request.py` |
| **Safe Eval** | AST-based parser — only arithmetic operators allowed | `runtime/tools/calculator.py` |
| **Sanitized Errors** | Generic error messages to LLM, no stack traces | All tools |
| **nginx Headers** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy | `nginx.conf` |
| **Redis Password** | `REDIS_PASSWORD` env var, `--requirepass` in docker | `docker-compose.yml` |
| **WebSocket Origin** | Origin header validation against known hosts | `api/ws.py` |
| **Input Validation** | Pydantic `Field(max_length=...)`, `Field(ge=, le=...)` | `app/schemas.py` |

## Current Repo Structure

```
cerebra-ai/
├── backend/
│   ├── app/
│   │   ├── api/           # 8 route modules
│   │   │   ├── agents.py      # Agent CRUD (5 endpoints)
│   │   │   ├── workflows.py   # Workflow CRUD (5 endpoints)
│   │   │   ├── runs.py        # Run trigger + status + events (4 endpoints)
│   │   │   ├── templates.py   # Template listing (1 endpoint, 60s cache)
│   │   │   ├── providers.py   # Provider CRUD + test + models + presets (7 endpoints)
│   │   │   ├── tools.py       # Tool CRUD + test (4 endpoints)
│   │   │   ├── channels.py    # Channel CRUD + Telegram webhook (3 endpoints)
│   │   │   └── ws.py          # WebSocket log streaming
│   │   ├── models/         # 8 SQLAlchemy ORM models
│   │   ├── services/       # 4 service modules (agent, workflow, run, provider)
│   │   ├── runtime/        # LangGraph compiler, executor, LLM client, nodes, tool registry
│   │   │   ├── nodes/      # agent_node, router_node
│   │   │   └── tools/      # registry, calculator, web_search, web_crawler, http_request
│   │   ├── channels/       # AbstractChannel + TelegramChannel
│   │   ├── auth.py         # Bearer token middleware + WS auth
│   │   ├── security.py     # Fernet encryption/decryption
│   │   ├── bus.py          # Redis pub/sub (graceful degradation)
│   │   ├── ratelimit.py    # Rate limiter + request body size middleware
│   │   ├── openapi_patch.py # Swagger example patcher
│   │   ├── docs.py         # Response example helpers
│   │   ├── schemas.py      # All Pydantic request/response schemas with examples
│   │   ├── config.py       # Pydantic settings from .env
│   │   ├── db.py           # Async SQLAlchemy engine + session
│   │   └── main.py         # FastAPI app entry
│   ├── tests/              # 38 tests (6 test files)
│   ├── alembic/            # Migration config + initial migration
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # 7 API modules (agents, workflows, runs, templates, providers, tools, client, auth)
│   │   ├── components/
│   │   │   ├── ui/         # 14 design system components
│   │   │   ├── AgentBuilder/   # AgentForm, AgentCard
│   │   │   ├── WorkflowCanvas/ # Canvas, 5 node types, EdgeMenu, NodeConfigPanel
│   │   │   ├── MonitorPanel/   # LiveLogs, MessageTrace
│   │   │   └── ToolBuilder/    # ToolForm, ToolTestDialog
│   │   ├── pages/          # 9 pages
│   │   ├── contexts/       # ThemeContext (light/dark/system + 6 accents)
│   │   ├── store/          # agentStore (Zustand)
│   │   ├── test/           # 7 test files (23 tests)
│   │   └── styles/         # theme.css (42 CSS variable definitions)
│   ├── nginx.conf
│   └── Dockerfile
├── templates/               # 4 workflow JSON templates
├── scripts/                 # run.bat, run.ps1, run.sh
├── PLAN/                    # Documentation
└── docker-compose.yml
```

## Data Models (8 tables)

### Agent
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| name | String(255) | Display name |
| role | String(255) | Functional role |
| system_prompt | Text | LLM system instruction |
| model | String(100) | Model identifier (e.g. gemini-2.0-flash) |
| tools | JSON | List of tool names |
| channel_id | UUID (FK, nullable) | Bound Telegram channel |
| memory_enabled | Bool | Conversation persistence |
| max_iterations | Int | Max LLM+tool cycles |
| guardrails | JSON | blocked_topics, max_tokens |

### WorkflowDef
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| name | String(255) | Display name |
| nodes | JSON | Node definitions (id, type, config) |
| edges | JSON | Edge definitions (source, target, condition) |
| trigger | JSON | Trigger config (manual, schedule, channel) |

### Run
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| workflow_id | UUID (FK) | Workflow executed |
| status | String | pending, running, completed, failed |
| started_at | DateTime | Execution start |
| finished_at | DateTime | Execution end |

### RunEvent
| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK, auto) | Sequential |
| run_id | UUID (FK) | Parent run |
| timestamp | DateTime | Event time |
| type | String | run_start, agent_start, tool_call, message, agent_end, run_end, run_error |
| agent_id | String | Emitter |
| payload | JSON | Varies by type |

### Channel
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| name | String(255) | Display name |
| type | String(50) | telegram |
| config | JSON | bot_token, webhook_url, workflow_id |

### ChannelMessage
| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK, auto) | Sequential |
| channel_id | UUID (FK, nullable) | Source channel |
| direction | String | incoming, outgoing |
| text | Text | Message body |
| metadata | JSON | Raw payload |
| created_at | DateTime | Received time |

### LLMProvider
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| name | String(255) | Display name |
| provider_type | String(50) | openai, gemini, anthropic, ollama, openrouter, custom |
| base_url | String(500) | API base URL |
| api_key | String(500) | Encrypted at rest (Fernet) |
| models | JSON | Cached model list |
| is_active | Bool | Visible in model selector |

### CustomTool
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| name | String(255, unique) | Tool name |
| description | String(500) | LLM-facing description |
| tool_type | String(50) | http, python, webhook |
| config | JSON | URL, method, headers, parameters, code |
| is_builtin | Bool | True for system tools |

## Testing Strategy

| Test | Type | File | Count |
|------|------|------|-------|
| Agent CRUD | Unit | `test_agent_crud.py` | 6 |
| Workflow CRUD | Unit | `test_workflows_crud.py` | 5 |
| Workflow compile | Unit | `test_workflow_compile.py` | 4 |
| Auth + encryption | Unit | `test_auth.py` | 5 |
| Config loading | Unit | `test_config.py` | 2 |
| Tools (calculator, SSRF, etc.) | Unit | `test_tools.py` | 11 |
| Multi-agent | Unit | `test_multi_agent.py` | 2 |
| E2E all endpoints | Integration | `test_all_endpoints.py` | 24 |
| E2E with real Gemini | Integration | `e2e_test.py` | 16 |
| Frontend components | Unit | `src/test/*` (7 files) | 23 |

Uses `pytest-asyncio` + `httpx.AsyncClient` for FastAPI tests. SQLite for unit tests (no Postgres needed). Redis failures caught gracefully.
