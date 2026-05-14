# Cerebra-AI — Project Roadmap

> AI Agent Orchestration Platform.

---

## Goal

Build a production-grade, locally-runnable platform where:
- Users create and configure AI agents (model, role, tools, memory, guardrails)
- Agents are wired into visual multi-agent workflows with conditions and feedback loops
- At least one agent is reachable via **Telegram**
- A web UI handles CRUD, the workflow canvas, and live monitoring
- Everything boots with `docker compose up`

---

## Build Phases — All Complete

### Phase 0 — Scaffold
- [x] Docker Compose (postgres, redis, backend, frontend)
- [x] FastAPI skeleton + health check
- [x] Alembic config + initial migration
- [x] React + Vite + Tailwind scaffold
- [x] `.env.example`, `Makefile`, run scripts

### Phase 1 — Agent CRUD + Runtime Core
- [x] 8 SQLAlchemy models
- [x] Full CRUD for agents, workflows, runs
- [x] Tool registry (web_search, calculator, http_request, web_crawler)
- [x] LangGraph compiler + executor
- [x] Agent node with guardrails

### Phase 2 — Multi-Agent & Async Messaging
- [x] Redis pub/sub bus
- [x] Router node (keyword-based conditions)
- [x] WebSocket log streaming
- [x] Per-run event channels

### Phase 3 — Frontend
- [x] 9 pages: Dashboard, Providers, Templates, Tools, Agents, Workflows, Runs, Channels, Settings
- [x] ReactFlow canvas with 5 node types
- [x] Edge condition editor
- [x] Monitor panel with live logs

### Phase 4 — Telegram Integration
- [x] Telegram webhook handler
- [x] Channel CRUD
- [x] Message history
- [x] 3-step bot setup wizard

### Phase 5 — Templates & Polish
- [x] 4 pre-built workflow templates
- [x] Template import with history
- [x] Token/cost tracking in run detail
- [x] Comprehensive READMEs

### Phase 6 — Security Hardening
- [x] Safe eval (AST), SSRF protection, CORS
- [x] Bearer token auth, Fernet encryption
- [x] Rate limiting, input validation
- [x] nginx security headers, Redis password
- [x] WebSocket origin, sanitized errors

### Phase 7 — UI Redesign & Polish
- [x] Rename to Cerebra-AI, responsive sidebar
- [x] Theme system: light/dark/system, 6 accent colors
- [x] 14-component design system
- [x] Loading skeletons, error states, empty states, error boundaries
- [x] Toast notifications, keyboard shortcuts

### Phase 8 — Agent Builder Features
- [x] Node config side panel
- [x] Human Gate, Output, Note node types
- [x] Tool testing dialog
- [x] Provider + Model selector in agent form

### Phase 9 — API Documentation
- [x] Every field has `description` + `examples`
- [x] All `body: dict` replaced with typed schemas
- [x] `response_model` on all endpoints
- [x] OpenAPI schema patch for Swagger pre-fill

### Phase 10 — Testing & CI
- [x] 34 backend unit tests
- [x] 23 frontend component tests
- [x] 16 E2E API tests with real Gemini
- [x] GitHub Actions workflow (commented out)

## Tech Stack

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| **Backend** | Python / FastAPI | Async-native for concurrent LLM calls, auto OpenAPI docs |
| **AI Runtime** | LangGraph | Graph = semantic match to visual workflows with conditionals |
| **LLM** | Gemini (swappable) | Provider system: OpenAI, Anthropic, Ollama, OpenRouter |
| **Database** | PostgreSQL + SQLite (dev) | JSON columns for flexible definitions |
| **Messaging** | Redis pub/sub | Lightweight event streaming to WebSocket |
| **Frontend** | React 19 + TypeScript | Zustand, TanStack Query, ReactFlow, Tailwind |
| **Encryption** | Fernet (PBKDF2) | Provider API keys encrypted at rest |
| **Infra** | Docker Compose | Single command boot |

## Site Navigation

```
Cerebra-AI
⚡ Providers → 📋 Templates → 🔧 Tools → 🤖 Agents
→ 🔀 Workflows → 📡 Channels → ▶️ Runs → ⚙️ Settings
```

The sidebar order is the onboarding order. First-time users see a 5-step setup guide on the Dashboard.
