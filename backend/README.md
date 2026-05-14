# Cerebra — Backend

AI Agent Orchestration Platform backend. FastAPI + LangGraph + Gemini.

## Tech Stack & Reasoning

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | FastAPI (async) | Native async for concurrent LLM calls, auto OpenAPI docs, Pydantic validation |
| **AI Runtime** | LangGraph | Graph-based execution is a direct semantic match to visual workflow builders with conditional branching and feedback loops. `StateGraph` provides checkpointing, `interrupt_before/after` enables human-in-the-loop, each node is a plain testable function |
| **LLM** | Google Gemini | No API key billing surprises for dev, `google-genai` SDK has clean async support. Provider system allows swapping to OpenAI/Anthropic/local via config |
| **Database** | PostgreSQL | JSON columns for flexible node/edge/tool definitions, `asyncpg` driver for non-blocking queries |
| **Messaging** | Redis | Lightweight pub/sub for streaming run events to WebSocket clients. No persistent message broker needed |
| **Encryption** | Fernet (cryptography) | PBKDF2-derived key from `ENCRYPTION_KEY` env var for encrypting provider API keys at rest |
| **Auth** | Bearer token | Configurable via `CEREBRA_API_KEY`. Disabled when empty for local dev |

## Current Architecture

```
Request → Auth Middleware → FastAPI Router → Service Layer → LangGraph Runtime
                    │                            │
                    ↓                            ↓
              PostgreSQL                      Redis pub/sub
                                                    │
                                          WebSocket → Frontend
```

- **Every request** (except `/health`, `/docs`, `/webhook`) is authenticated via `Authorization: Bearer` if `CEREBRA_API_KEY` is set
- **Provider API keys** are encrypted at rest with Fernet symmetric encryption
- **Tool calls** from the LLM are protected: `http_request` resolves DNS to block SSRF, `calculator` uses AST-based safe eval
- **Error messages** returned to the LLM are sanitized (no internal details leaked)

## API Endpoints

### Agents
| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents` | List all agents |
| POST | `/agents` | Create agent (name, role, system_prompt, model, tools, guardrails) |
| GET | `/agents/{id}` | Get agent |
| PATCH | `/agents/{id}` | Update agent |
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
| GET | `/templates` | List pre-built workflow templates |

### Providers
| Method | Path | Description |
|--------|------|-------------|
| GET | `/providers` | List LLM providers |
| POST | `/providers` | Add provider (with preset: openai/gemini/anthropic/ollama/openrouter) |
| DELETE | `/providers/{id}` | Remove provider |
| GET | `/providers/models` | All models from active providers |
| GET | `/providers/presets` | Provider preset list |

### Tools
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tools` | List all tools (built-in + custom) |
| POST | `/tools` | Create custom tool (HTTP/Python/Webhook) |
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
| GET | `/health` | Health check |

## Project Structure

```
backend/
├── app/
│   ├── api/           # Route handlers (8 modules: agents, workflows, runs, templates, providers, tools, channels, ws)
│   ├── models/        # SQLAlchemy ORM models (7 models)
│   ├── services/      # Business logic layer (4 modules)
│   ├── runtime/       # LangGraph compiler, executor, LLM client, nodes, tool registry
│   │   ├── nodes/     # agent_node.py, router_node.py
│   │   └── tools/     # registry.py + calculator, web_search, web_crawler, http_request
│   ├── channels/      # AbstractChannel + TelegramChannel
│   ├── auth.py        # Bearer token middleware + WS auth
│   ├── security.py    # Fernet encryption for API keys
│   ├── bus.py         # Redis pub/sub wrapper
│   ├── config.py      # Pydantic settings from .env
│   ├── db.py          # Async SQLAlchemy engine + session
│   ├── schemas.py     # Pydantic request/response schemas
│   └── main.py        # FastAPI entry point
├── tests/             # pytest suite (15 tests, 4 skip without API key)
├── Dockerfile         # Python 3.12-slim, no --reload in prod
├── requirements.txt   # pip dependencies
└── pyproject.toml     # uv dependency manifest
```

## Security

- **Authentication**: All API routes require `Authorization: Bearer <key>` if `CEREBRA_API_KEY` is set. WebSocket uses `?token=` param. Public paths: `/health`, `/docs`, `/channels/webhook/telegram`.
- **Encryption at rest**: Provider API keys are encrypted with `cryptography.fernet` (PBKDF2-SHA256, 600K iterations). Keys are masked in API responses (`sk-...abcd`).
- **SSRF protection**: `http_request` tool resolves DNS to IP before checking against private network blocklist (127.0.0.0/8, 10.0.0.0/8, etc.). Hostnames resolving to private IPs are rejected.
- **Safe eval**: Calculator uses AST-based expression parser allowing only arithmetic operators. No `eval()`.
- **CORS**: Configurable via `CORS_ORIGINS` env var (default: localhost:5173).
- **Sanitized errors**: Tool error messages returned to the LLM are generic — no stack traces or internal details leaked.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No* | — | Google Gemini API key (required to run workflows) |
| `DATABASE_URL` | No | postgresql+asyncpg://postgres:postgres@localhost:5432/cerebra | Postgres connection |
| `REDIS_URL` | No | redis://localhost:6379/0 | Redis connection |
| `CEREBRA_API_KEY` | No | — | API key for auth (empty = no auth) |
| `ENCRYPTION_KEY` | No | — | Key for encrypting provider API keys |
| `CORS_ORIGINS` | No | http://localhost:5173,http://localhost:8000 | Allowed CORS origins |
| `TELEGRAM_BOT_TOKEN` | No | — | Telegram bot token |
| `TELEGRAM_WEBHOOK_URL` | No | — | Telegram webhook URL |
| `DB_POOL_SIZE` | No | 5 | asyncpg connection pool size |
| `DB_MAX_OVERFLOW` | No | 10 | asyncpg max overflow connections |

## Testing

```bash
cd backend
python -m pytest tests/ -v
```

Tests use SQLite (aiosqlite), no Postgres needed. Redis failures are caught gracefully. Gemini-dependent tests auto-skip when `GEMINI_API_KEY` is unset.
