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
- **Visual Workflow Builder** — drag-and-drop ReactFlow canvas with 5 node types (Agent, Router, Human Gate, Output, Note)
- **Run & Monitor** — trigger workflows, stream live logs via WebSocket, trace inter-agent messages
- **Multi-LLM** — configure any provider: OpenAI, Gemini, Anthropic, Ollama (local), OpenRouter
- **Custom Tools** — build your own HTTP/Python/Webhook tools with parameter definitions
- **Template Library** — pre-built workflow templates with import history tracking
- **Telegram Integration** — connect a Telegram bot and trigger workflows from chat messages

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

## Navigation

```
Cerebra
⚡ Providers  →  📋 Templates  →  🔧 Tools  →  🤖 Agents
→  🔀 Workflows  →  📡 Channels  →  ▶️ Runs  →  ⚙️ Settings
```

## Docs

- [Backend README](backend/README.md) — full API reference, security, config
- [Frontend README](frontend/README.md) — component docs, theming, build
- [Developer Guide](DEVELOPER_GUIDE.md) — setup, testing, adding tools/channels
- [Project Roadmap](PLAN/ROADMAP.md) — build phases, UX plan, tech stack
- [Architecture](PLAN/ARCHITECTURE.md) — system design, data models
- [Checklist](CHECKLIST.md) — bugs, fixes, remaining items
