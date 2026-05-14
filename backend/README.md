# Cerebra‑AI — Backend

AI Agent Orchestration Platform backend. FastAPI + LangGraph + Gemini (swappable).

## Tech Stack & Reasoning

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | FastAPI (async) | Native async for concurrent LLM calls, auto OpenAPI docs with examples |
| **AI Runtime** | LangGraph | Graph execution matches visual workflow builder with conditional branching |
| **LLM** | Google Gemini (swappable) | Provider system: OpenAI, Anthropic, Ollama, OpenRouter via config |
| **Database** | PostgreSQL + SQLite (dev) | JSON columns for flexible node/edge/tool definitions |
| **Messaging** | Redis pub/sub | Lightweight event streaming to WebSocket clients |
| **Encryption** | Fernet (cryptography) | PBKDF2-derived key from ENCRYPTION_KEY for provider API keys |
| **Auth** | Bearer token | Configurable via CEREBRA_API_KEY. Disabled when empty |

## Project Structure

```
backend/
├── app/
│   ├── api/           # 8 modules: agents, workflows, runs, templates, providers, tools, channels, ws
│   ├── models/        # 8 ORM models
│   ├── services/      # Business logic (agent, workflow, run, provider)
│   ├── runtime/       # LangGraph compiler, executor, LLM client, agent/router nodes, tool registry
│   └── app/
│       ├── auth.py        # Bearer token middleware + WS auth
│       ├── security.py    # Fernet encryption for API keys
│       ├── bus.py         # Redis pub/sub (graceful degradation)
│       ├── ratelimit.py   # In-memory rate limiter + request size check
│       ├── openapi_patch.py # Auto-adds singular examples to Swagger
│       └── docs.py        # Response example helpers for Swagger
├── tests/             # 38 tests (34 pass, 4 skip without API key)
├── Dockerfile         # Python 3.12-slim, no --reload in prod
└── requirements.txt   # pip / uv dependencies
```

## API Endpoints

All endpoints have typed Pydantic schemas with examples, response models, and error codes documented in Swagger (`/docs`).

### Agents
| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents` | List all agents |
| POST | `/agents` | Create agent (name, role, system_prompt, model, tools, guardrails) |
| GET | `/agents/{id}` | Get agent by UUID |
| PATCH | `/agents/{id}` | Partial update |
| DELETE | `/agents/{id}` | Delete agent |

### Workflows
| Method | Path | Description |
|--------|------|-------------|
| GET | `/workflows` | List all workflows |
| POST | `/workflows` | Create workflow (nodes + edges + trigger) |
| GET | `/workflows/{id}` | Get workflow |
| PATCH | `/workflows/{id}` | Save canvas changes |
| DELETE | `/workflows/{id}` | Delete workflow |

### Runs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/runs` | List all runs |
| POST | `/runs` | Trigger a workflow run |
| GET | `/runs/{id}` | Get run status |
| GET | `/runs/{id}/events` | Get run event trace |
| WS | `/ws/runs/{run_id}` | Live event stream |

### Templates
| Method | Path | Description |
|--------|------|-------------|
| GET | `/templates` | List pre-built workflow templates (60s cache) |

### Providers
| Method | Path | Description |
|--------|------|-------------|
| GET | `/providers` | List LLM providers (keys masked) |
| POST | `/providers` | Add provider (with preset: openai/gemini/anthropic/ollama/openrouter) |
| PATCH | `/providers/{id}` | Update provider |
| DELETE | `/providers/{id}` | Remove provider |
| POST | `/providers/test` | Test connection with real API call |
| GET | `/providers/models` | All models from active providers |
| GET | `/providers/presets` | Provider presets with key format hints |

### Tools
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tools` | List all tools (built-in + custom) |
| POST | `/tools` | Create custom tool (HTTP/Python/Webhook) |
| POST | `/tools/test` | Test tool with sample input |
| DELETE | `/tools/{id}` | Delete custom tool |

### Channels
| Method | Path | Description |
|--------|------|-------------|
| GET | `/channels` | List channels |
| POST | `/channels` | Create channel (Telegram) |
| POST | `/channels/webhook/telegram` | Telegram incoming webhook |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (public, no auth) |

## Security

- **Auth**: All routes require `Authorization: Bearer <key>` if `CEREBRA_API_KEY` is set. Public: `/health`, `/docs`, `/webhook`.
- **Encryption at rest**: Provider API keys encrypted with `cryptography.fernet` (PBKDF2-SHA256, 600K iterations). Masked in responses.
- **SSRF protection**: `http_request` tool resolves DNS to IP before checking against private network blocklist.
- **Safe eval**: AST-based calculator parser — no `eval()`.
- **Rate limiting**: In-memory sliding window — 10/min on /runs, 100/min on other endpoints.
- **Request size limit**: 5MB max body via middleware.
- **WebSocket origin**: Origin header validation against known hosts.
- **CORS**: Configurable via `CORS_ORIGINS` env var.
- **Sanitized errors**: Generic error messages to LLM — no stack traces leaked.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No* | — | Gemini key (required to run workflows) |
| `DATABASE_URL` | No | postgresql+asyncpg://postgres:postgres@localhost:5432/cerebra | Postgres (use sqlite+aiosqlite for dev) |
| `REDIS_URL` | No | redis://localhost:6379/0 | Redis connection |
| `CEREBRA_API_KEY` | No | — | API key for auth (empty = no auth) |
| `ENCRYPTION_KEY` | No | — | Fernet key for encrypting provider API keys |
| `CORS_ORIGINS` | No | http://localhost:5173 | Allowed CORS origins |
| `REDIS_PASSWORD` | No | — | Redis auth password |

## Testing

```bash
cd backend
python -m pytest tests/ -v            # 34 pass
python test_all_endpoints.py          # 24/24 endpoint tests pass
python e2e_test.py                    # 16/16 E2E tests with real Gemini API
```

Tests use SQLite (aiosqlite), no Postgres needed. Redis failures are caught gracefully.
