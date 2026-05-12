# Cerebra — Backend

AI Agent Orchestration Platform backend. FastAPI + LangGraph + Gemini.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | FastAPI (async, auto OpenAPI docs) |
| AI Runtime | LangGraph (StateGraph, conditionals, checkpoints) |
| LLM | Google Gemini (via `google-genai`) |
| Database | PostgreSQL (SQLAlchemy async) |
| Cache/Messaging | Redis (pub/sub for run events) |
| Auth | None (local-first, OAuth-free) |

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up environment
cp ../.env.example ../.env
# Add your GEMINI_API_KEY to ../.env

# 3. Start dependencies (Postgres + Redis)
docker compose up postgres redis -d

# 4. Run the server
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs.

## API Endpoints

### Agents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents` | List all agents |
| POST | `/agents` | Create an agent |
| GET | `/agents/{id}` | Get agent details |
| PATCH | `/agents/{id}` | Update agent |
| DELETE | `/agents/{id}` | Delete agent |

**Agent payload:**

```json
{
  "name": "Researcher",
  "role": "research_assistant",
  "system_prompt": "You are a research assistant...",
  "model": "gemini-2.0-flash",
  "tools": ["web_search", "calculator"],
  "memory_enabled": true,
  "max_iterations": 10,
  "guardrails": { "blocked_topics": ["politics"], "max_tokens": 4096 }
}
```

### Workflows

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workflows` | List all workflows |
| POST | `/workflows` | Create a workflow |
| GET | `/workflows/{id}` | Get workflow details |
| PATCH | `/workflows/{id}` | Update workflow |
| DELETE | `/workflows/{id}` | Delete workflow |

**Workflow payload:**

```json
{
  "name": "Research & Report",
  "nodes": [
    { "id": "researcher", "type": "agent", "config": { "system_prompt": "...", "tools": ["web_search"] } },
    { "id": "writer", "type": "agent", "config": { "system_prompt": "...", "tools": [] } }
  ],
  "edges": [
    { "source": "researcher", "target": "writer", "condition": null }
  ],
  "trigger": { "type": "manual", "config": {} }
}
```

### Runs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/runs` | List all runs |
| POST | `/runs` | Trigger a workflow run |
| GET | `/runs/{id}` | Get run status |
| GET | `/runs/{id}/events` | Get run event history |

### WebSocket

| Path | Description |
|------|-------------|
| `ws://host:8000/ws/runs/{run_id}` | Live event stream for a run |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{"status": "ok"}` |

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── agents.py          # Agent CRUD endpoints
│   │   ├── workflows.py       # Workflow CRUD endpoints
│   │   ├── runs.py            # Run trigger + status endpoints
│   │   └── ws.py              # WebSocket log streaming
│   ├── models/
│   │   ├── agent.py           # Agent SQLAlchemy model
│   │   ├── workflow.py        # WorkflowDef model
│   │   ├── run.py             # Run + RunEvent models
│   │   └── message.py         # Channel + ChannelMessage models
│   ├── services/
│   │   ├── agent_service.py   # Agent business logic
│   │   ├── workflow_service.py
│   │   └── run_service.py
│   ├── runtime/
│   │   ├── compiler.py        # WorkflowDef JSON → LangGraph CompiledGraph
│   │   ├── executor.py        # Run graph, emit events
│   │   ├── llm.py             # Gemini LLM wrapper
│   │   ├── state.py           # WorkflowState TypedDict
│   │   ├── nodes/
│   │   │   ├── agent_node.py  # LLM + tool call loop with guardrails
│   │   │   └── router_node.py # Conditional edge routing
│   │   └── tools/
│   │       ├── registry.py    # Tool catalog (decorator-based)
│   │       ├── calculator.py  # Math expression evaluator
│   │       ├── web_search.py  # DuckDuckGo lite search
│   │       └── http_request.py
│   ├── channels/              # Messaging channel integrations
│   │   └── base.py            # Abstract channel interface
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── config.py              # Pydantic Settings (env-based)
│   ├── db.py                  # SQLAlchemy async engine + session
│   ├── bus.py                 # Redis pub/sub wrapper
│   └── main.py                # FastAPI app entry point
├── tests/
│   ├── test_agent_crud.py
│   ├── test_workflow_compile.py
│   ├── test_workflows_crud.py
│   ├── test_runs_api.py
│   ├── test_run_execution.py
│   ├── test_multi_agent.py
│   └── conftest.py
├── alembic/                   # DB migrations
├── Dockerfile
└── requirements.txt
```

## Configuration

All config via environment variables (see `.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `DATABASE_URL` | No | `postgresql+asyncpg://postgres:postgres@localhost:5432/cerebra` | Postgres connection string |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection string |
| `TELEGRAM_BOT_TOKEN` | No | — | Telegram bot token |
| `TELEGRAM_WEBHOOK_URL` | No | — | Telegram webhook URL |

## Testing

```bash
cd backend
python -m pytest tests/ -v
```

Tests use SQLite (aiosqlite) in-memory, so no Postgres needed. Redis failures are caught gracefully. Tests that require a real Gemini API key are auto-skipped when `GEMINI_API_KEY` is unset.

## Architecture

```
HTTP Request → FastAPI Router → Service Layer → LangGraph Runtime → LLM (Gemini)
                    │                              │
                    ↓                              ↓
              PostgreSQL                      Redis pub/sub
                                                    │
                                                    ↓
                                              WebSocket → UI
```

Each workflow is compiled into a LangGraph `StateGraph` at runtime. Nodes execute as async Python functions. Inter-agent messages flow through shared graph state. Redis pub/sub streams run events to the frontend via WebSocket.
