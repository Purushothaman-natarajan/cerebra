# Cerebra

AI Agent Orchestration Platform — multi-agent workflows with a visual canvas, multi-LLM support, custom tool building, and Telegram integration.

## Quick Start

```bash
cp .env.example .env   # add your GEMINI_API_KEY
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs** (Swagger): http://localhost:8000/docs

## What It Does

- **Create AI Agents** — configure system prompt, model (any provider), tools, guardrails, memory
- **Visual Workflow Builder** — drag-and-drop ReactFlow canvas to wire agents into multi-step pipelines with conditional routing
- **Run & Monitor** — trigger workflows, stream live logs via WebSocket, trace inter-agent messages
- **Multi-LLM** — configure any provider: OpenAI, Gemini, Anthropic, Ollama (local), OpenRouter
- **Custom Tools** — build your own HTTP/Python/Webhook tools with parameter definitions
- **Telegram Integration** — connect a Telegram bot and trigger workflows from chat messages
- **Pre-built Templates** — Research & Report (3-agent), Support Triage (router + 3 specialists), Web Research (crawler + analyst)

## Architecture

```
React Frontend (ReactFlow canvas + 7 pages)
    │ REST + WebSocket (auth: Bearer token)
FastAPI Backend (auth middleware → routers → services)
    │ LangGraph CompiledGraph
Agent Runtime (nodes, tools, guardrails)
    │ Redis pub/sub (per-run channels)
PostgreSQL (state, history)   Telegram Bot (channel)
```

## Tech Stack

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| **Backend** | Python / FastAPI | Async-native for concurrent LLM calls, auto OpenAPI docs |
| **AI Runtime** | LangGraph | Graph = semantic match to visual workflows with conditionals |
| **LLM** | Gemini (default), swappable | Provider system: OpenAI, Anthropic, Ollama, OpenRouter |
| **Database** | PostgreSQL | JSON columns for flexible node/edge/tool definitions |
| **Messaging** | Redis pub/sub | Lightweight event streaming to WebSocket clients |
| **Frontend** | React 19 + TypeScript | Zustand, TanStack Query, ReactFlow, Tailwind |
| **Infra** | Docker Compose | Single command boot: `docker compose up` |

## Project Structure

```
├── backend/           # FastAPI + LangGraph + Gemini
│   ├── app/api/       # 8 route modules (agents, workflows, runs, templates, providers, tools, channels, ws)
│   ├── app/models/    # 7 SQLAlchemy models
│   ├── app/runtime/   # LangGraph compiler, executor, nodes, tools
│   ├── app/services/  # Business logic
│   ├── app/channels/  # Telegram integration
│   └── tests/         # pytest suite (15 tests)
├── frontend/          # React + TypeScript + ReactFlow
│   ├── src/pages/     # 7 pages (Dashboard, Agents, Workflows, Runs, Providers, Tools, Channels)
│   ├── src/components/# UI kit + AgentBuilder + WorkflowCanvas + MonitorPanel + ToolBuilder
│   └── src/api/       # TanStack Query hooks + auth fetch client
├── templates/         # 3 pre-built workflow JSON templates
├── PLAN/              # Architecture, roadmap, tech stack docs
└── docker-compose.yml
```

## API Summary

| Group | Description |
|-------|-------------|
| `/agents` | CRUD for AI agents |
| `/workflows` | CRUD for workflow definitions |
| `/runs` | Trigger + status + event history |
| `/ws/runs/{id}` | Live event stream |
| `/templates` | Pre-built workflow templates |
| `/providers` | LLM provider config (encrypted API keys) |
| `/tools` | Custom tool definitions |
| `/channels` | Telegram webhook integration |
| `/health` | Health check (public) |

## Configuration

See `.env.example` and [backend/README.md](backend/README.md) for all env vars.

| Key Variable | Description |
|-------------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `CEREBRA_API_KEY` | API key for auth (empty = no auth) |
| `ENCRYPTION_KEY` | Encrypts provider API keys at rest |

## Security

- **Auth**: Bearer token on all routes (opt-in via `CEREBRA_API_KEY`)
- **Encryption**: Provider API keys encrypted with Fernet at rest
- **SSRF**: DNS resolution before private IP check on `http_request` tool
- **Safe eval**: AST-based calculator, no `eval()`
- **CORS**: Configurable origins
- **Sanitized errors**: No internal details leaked to LLM

## Docs

- [Backend README](backend/README.md) — full API reference, security, config
- [Frontend README](frontend/README.md) — component docs, theming, build
- [Developer Guide](DEVELOPER_GUIDE.md) — setup, testing, adding tools/channels
- [PLAN/ARCHITECTURE.md](PLAN/ARCHITECTURE.md) — system design, data models
