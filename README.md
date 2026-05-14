# 🌸 Orchid

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
React Frontend (ReactFlow canvas + 8 pages)
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

## Navigation

```
🌸 Orchid
⚡ Providers  →  🔧 Tools  →  🤖 Agents  →  🔀 Workflows  →  📡 Channels  →  ▶️ Runs  →  ⚙️ Settings
```

The sidebar order is the onboarding order. First-time users see a 5-step setup guide on the Dashboard.

## Docs

- [Backend README](backend/README.md) — full API reference, security, config
- [Frontend README](frontend/README.md) — component docs, theming, build
- [Developer Guide](DEVELOPER_GUIDE.md) — setup, testing, adding tools/channels
- [Project Roadmap](PLAN/ROADMAP.md) — build phases, UX plan, tech stack reasoning
- [Architecture](PLAN/ARCHITECTURE.md) — system design, data models, testing strategy
- [Tech Stack](PLAN/TECHSTACK.md) — technology justifications
- [Checklist](CHECKLIST.md) — bugs, fixes, remaining items
