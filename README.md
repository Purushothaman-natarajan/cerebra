# Cerebra‑AI

AI Agent Orchestration Platform — multi-agent workflows with visual canvas, multi-LLM support, custom tool building, Telegram integration, and template library.

## Quick Start

```bash
cp .env.example .env   # add your GEMINI_API_KEY
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs** (Swagger): http://localhost:8000/docs

## Features

| Feature | Status | Details |
|---------|--------|---------|
| **Multi-LLM Providers** | ✅ | OpenAI, Gemini, Anthropic, Ollama, OpenRouter — keys encrypted at rest (Fernet) |
| **Agent Builder** | ✅ | Create agents with system prompt, model, tools, memory, guardrails |
| **Visual Workflow Canvas** | ✅ | ReactFlow with 5 node types: Agent, Router, Human Gate, Output, Note |
| **Template Library** | ✅ | 4 pre-built templates with import history tracking |
| **Custom Tools** | ✅ | HTTP, Python, Webhook tools with parameter definitions & live testing |
| **Run Engine** | ✅ | LangGraph-based execution with WebSocket live logging |
| **Telegram Integration** | ✅ | 3-step bot setup wizard, webhook message routing |
| **Authentication** | ✅ | Bearer token middleware, WebSocket token param |
| **Rate Limiting** | ✅ | 10/min on runs, 100/min on other endpoints |
| **OpenAPI Docs** | ✅ | Swagger UI at /docs with per-field examples and response schemas |
| **CI/CD** | ⏸️ | GitHub Actions workflow (ready, triggers commented out) |

## Architecture

```
React Frontend (ReactFlow canvas, 8 pages, responsive)
    │ REST + WebSocket (auth: Bearer token)
FastAPI Backend (auth middleware → routers → services → LangGraph)
    │ Redis pub/sub (per-run event streaming)
PostgreSQL (state, history, encrypted keys)   Telegram Bot (webhook)
```

## Navigation

```
Cerebra‑AI
  ⚡ Providers → 📋 Templates → 🔧 Tools → 🤖 Agents
  → 🔀 Workflows → 📡 Channels → ▶️ Runs → ⚙️ Settings
```

The sidebar order is the onboarding order — first-time users see a setup guide on the Dashboard.

## Test Status

| Suite | Results |
|-------|---------|
| Backend unit tests | **34 pass**, 4 skip (need GEMINI_API_KEY) |
| Frontend component tests | **23 pass** (vitest) |
| End-to-end API test | **16/16 pass** with real Gemini API |
| Frontend build | Clean (0 TypeScript errors) |

## Docs

- [Backend README](backend/README.md) — API reference, security, config, development
- [Frontend README](frontend/README.md) — component kit, pages, theming, testing
- [Developer Guide](DEVELOPER_GUIDE.md) — setup, testing, adding tools/channels/providers
- [Project Roadmap](PLAN/ROADMAP.md) — build phases, UX plan, tech stack
- [Architecture](PLAN/ARCHITECTURE.md) — system design, data models, testing strategy
- [Checklist](CHECKLIST.md) — bugs, fixes, remaining items
