# Cerebra

AI Agent Orchestration Platform — multi-agent workflows with visual canvas, Telegram integration, and Gemini LLM backend.

## Quick Start

```bash
cp .env.example .env   # add your GEMINI_API_KEY
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs** (Swagger): http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## What It Does

- **Create AI Agents** — configure model, role, tools (web_search, calculator, http_request), guardrails, and memory
- **Visual Workflow Builder** — drag-and-drop ReactFlow canvas to wire agents into multi-step pipelines with conditional routing
- **Run & Monitor** — trigger workflows, stream live logs via WebSocket, trace inter-agent messages
- **Telegram Integration** — connect a Telegram bot and trigger workflows from chat messages
- **Pre-built Templates** — Research & Report pipeline, Support Triage with conditional routing

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python / FastAPI (async) |
| AI Runtime | LangGraph (StateGraph, conditional edges) |
| LLM | Google Gemini (via `google-genai`) |
| Database | PostgreSQL (SQLAlchemy async) |
| Cache/Messaging | Redis (pub/sub) |
| Frontend | React 19 / TypeScript / Vite |
| Canvas | ReactFlow |
| UI | Tailwind CSS / Lucide Icons |
| Messaging | Telegram (python-telegram-bot) |
| Infra | Docker Compose |

## Project Structure

```
├── backend/           # FastAPI + LangGraph + Gemini
│   ├── app/
│   │   ├── api/       # REST + WebSocket endpoints
│   │   ├── runtime/   # LangGraph compiler, executor, nodes
│   │   ├── models/    # SQLAlchemy models
│   │   ├── services/  # Business logic
│   │   └── channels/  # Telegram integration
│   └── tests/
├── frontend/          # React + TypeScript + ReactFlow
│   └── src/
│       ├── pages/     # Agents, Workflows, Runs, Channels
│       ├── components/# AgentBuilder, WorkflowCanvas, MonitorPanel
│       ├── api/       # TanStack Query hooks
│       └── store/     # Zustand stores
├── templates/         # Pre-built workflow JSON templates
├── PLAN/              # Architecture, roadmap, tech stack docs
└── docker-compose.yml
```

## Architecture

```
React Frontend (ReactFlow canvas + monitors)
    │ REST + WebSocket
FastAPI Backend
    │ LangGraph CompiledGraph
Agent Runtime (nodes, tools, guardrails)
    │ Redis pub/sub
PostgreSQL (state)   Telegram Bot (channel)
```

## API Summary

| Endpoint Group | Description |
|----------------|-------------|
| `GET/POST/PATCH/DELETE /agents` | Agent CRUD |
| `GET/POST/PATCH/DELETE /workflows` | Workflow CRUD |
| `POST /runs` | Trigger workflow run |
| `GET /runs/{id}/events` | Run event history |
| `WS /ws/runs/{run_id}` | Live event stream |
| `POST /channels/webhook/telegram` | Telegram webhook |
| `GET /health` | Health check |

## Environment Variables

See `.env.example`. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `DATABASE_URL` | No | Postgres connection (default: localhost:5432) |
| `REDIS_URL` | No | Redis connection (default: localhost:6379) |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token |
| `TELEGRAM_WEBHOOK_URL` | No | Telegram webhook URL |

## Docs

- [Backend README](backend/README.md) — full API reference, setup, testing
- [Frontend README](frontend/README.md) — component architecture, dev guide
- [PLAN/ARCHITECTURE.md](PLAN/ARCHITECTURE.md) — system design, data models
- [PLAN/ROADMAP.md](PLAN/ROADMAP.md) — build phases and progress
- [PLAN/TECHSTACK.md](PLAN/TECHSTACK.md) — technology justifications
