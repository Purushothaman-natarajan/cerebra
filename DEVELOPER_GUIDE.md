# Developer Guide

## Local Development Setup

### Prerequisites

- Python 3.12+
- Node.js 22+
- Docker Desktop (for Postgres + Redis)
- Git

### 1. Clone & Environment

```bash
git clone https://github.com/your-org/cerebra.git
cd cerebra
cp .env.example .env
```

Edit `.env` and add your `GEMINI_API_KEY`.

### 2. Start Dependencies

```bash
docker compose up postgres redis -d
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate    # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify: http://localhost:8000/health → `{"status":"ok"}`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173. API calls proxy to `localhost:8000`.

## Project Layout

```
backend/           # Python / FastAPI
  app/
    api/           # Route handlers (REST + WebSocket)
    models/        # SQLAlchemy ORM models
    services/      # Business logic layer
    runtime/       # LangGraph compiler, executor, nodes, tools
      nodes/       # Agent node, Router node
      tools/       # Tool registry + built-in tools
    channels/      # Messaging channel integrations
  tests/           # pytest suite
frontend/          # React / TypeScript / Vite
  src/
    api/           # TanStack Query hooks
    components/    # Reusable UI components
    pages/         # Route-level page components
    store/         # Zustand state stores
templates/         # Pre-built workflow JSON files
```

## Database

### Schema Migrations (Alembic)

```bash
cd backend

# Create a new migration after model changes
alembic revision --autogenerate -m "description"

# Apply pending migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

Models auto-create on first startup (`Base.metadata.create_all`). For production, use `alembic upgrade head`.

## Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/ -v

# Run a specific test file
python -m pytest tests/test_agent_crud.py -v

# Run with coverage
pip install pytest-cov
python -m pytest tests/ --cov=app
```

Tests use SQLite in-memory (no Postgres needed). Redis failures are caught gracefully. API key–dependent tests auto-skip when `GEMINI_API_KEY` is unset.

### Writing Tests

```python
# tests/test_agent_crud.py
@pytest.mark.asyncio
async def test_create_agent(client: AsyncClient):
    resp = await client.post("/agents", json={
        "name": "Test Agent",
        "role": "assistant",
        "system_prompt": "You are helpful.",
    })
    assert resp.status_code == 201
```

- Use `client` fixture for HTTP tests
- Use `db_session` fixture for direct DB access
- Mark integration tests with `@pytest.mark.skipif(not os.getenv("GEMINI_API_KEY"), ...)`

## Adding a New Tool

Tools live in `backend/app/runtime/tools/`. They use a decorator-based registry.

```python
# backend/app/runtime/tools/my_tool.py
from app.runtime.tools.registry import register

@register("my_tool")
async def my_tool(param: str) -> str:
    """Description shown to the LLM. Input: what the tool expects. Output: what it returns."""
    # Your implementation here
    return f"Processed: {param}"
```

Then import it in `backend/app/runtime/tools/__init__.py`:

```python
import app.runtime.tools.my_tool  # noqa: F401
```

The LLM will automatically see the tool when an agent has `"my_tool"` in its `tools` list.

## Adding a New Agent Type

Agents are generic — they just need a system prompt, model name, and tool list. To add a specialized variant:

1. Create the agent via the API or UI (set `model`, `system_prompt`, `tools`)
2. Reference it in a workflow node: `{"id": "my_agent", "type": "agent", "config": {...}}`

No code changes needed — everything is data-driven.

## Adding a New Messaging Channel

Channels implement `AbstractChannel`:

```python
# backend/app/channels/my_channel.py
from app.channels.base import AbstractChannel

class MyChannel(AbstractChannel):
    async def send_message(self, chat_id: str, text: str) -> bool:
        ...

    async def process_webhook(self, payload: dict) -> dict | None:
        ...
```

Then add a webhook route in `backend/app/api/channels.py`.

## Workflow Templates

Templates are JSON files in `templates/`. Load them via the API:

```bash
curl -X POST http://localhost:8000/workflows \
  -H "Content-Type: application/json" \
  -d @templates/research_and_report.json
```

### Template Structure

```json
{
  "name": "My Workflow",
  "nodes": [
    {
      "id": "step1",
      "type": "agent",
      "config": {
        "system_prompt": "...",
        "model": "gemini-2.0-flash",
        "tools": ["web_search"],
        "max_iterations": 5,
        "guardrails": { "blocked_topics": [], "max_tokens": 4096 }
      }
    },
    {
      "id": "router1",
      "type": "router",
      "config": {
        "conditions": { "route_a": ["keyword1", "keyword2"] }
      }
    }
  ],
  "edges": [
    { "source": "step1", "target": "router1", "condition": null },
    { "source": "router1", "target": "step2", "condition": "route_a" }
  ],
  "trigger": { "type": "manual", "config": {} }
}
```

### Node Types

| Type | Description |
|------|-------------|
| `agent` | Runs an LLM with optional tools and guardrails |
| `router` | Evaluates conditions and routes to the matching edge |

### Router Conditions

Router nodes evaluate keyword-based conditions against the last assistant message. The edge with a matching condition name (where the message contains the keywords defined in the router's config) is followed.

### Edge Properties

| Property | Description |
|----------|-------------|
| `source` | Source node ID |
| `target` | Target node ID |
| `condition` | Condition name (matches router config) or null for unconditional |
| `fallback` | Target when condition doesn't match (defaults to `target`) |

## Configuration Reference

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `GEMINI_API_KEY` | — | Google Gemini API key (required) |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/cerebra` | Async Postgres connection |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |
| `TELEGRAM_BOT_TOKEN` | — | Telegram bot token |
| `TELEGRAM_WEBHOOK_URL` | — | Telegram webhook URL |

## Running Without Docker

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Postgres + Redis (if not using Docker)
# Ensure local Postgres and Redis instances are running
```

## Common Tasks

### Reset the Database

```bash
docker compose down -v    # Deletes volumes including Postgres data
docker compose up -d      # Fresh start
```

### View API Docs

http://localhost:8000/docs — auto-generated Swagger UI.

### Debug WebSocket

```bash
# Connect to a run's event stream
wscat -c ws://localhost:8000/ws/runs/<run-id>
```

### Create an Agent via CLI

```bash
curl -X POST http://localhost:8000/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Researcher",
    "role": "research",
    "system_prompt": "You are a researcher.",
    "model": "gemini-2.0-flash",
    "tools": ["web_search", "calculator"]
  }'
```

## Troubleshooting

### "No API key was provided"

Set `GEMINI_API_KEY` in `.env` or as an environment variable.

### Redis Connection Refused

Make sure Redis is running (`docker compose up redis -d`). The application degrades gracefully — WebSocket streaming won't work without Redis.

### Port Already in Use

Change ports in `docker-compose.yml` or use `--port` for local dev servers.

### Database Connection Error

Ensure Postgres is running and `DATABASE_URL` is correct. On first boot, tables are created automatically.

## Git Workflow

```bash
# Create a feature branch
git checkout -b feat/my-feature

# Commit changes
git add -A
git commit -m "description of changes"

# Keep branch updated
git fetch origin
git rebase origin/main

# Push and create PR
git push -u origin feat/my-feature
```

Keep commits focused. Follow existing code style in the repository.
