# Cerebra‑AI

AI Agent Orchestration Platform — multi-agent workflows with a visual canvas, multi-LLM provider support, custom tool building, Telegram integration, and a template library.

---

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env          # edit with your GEMINI_API_KEY
docker compose up --build
```

Then open:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs

### Local development

```bash
# Terminal 1: Backend
cd backend
uv venv && uv sync
cp ../.env.example .env
set DATABASE_URL=sqlite+aiosqlite:///./cerebra.db
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

One-command scripts also available:
- **Windows**: `.\scripts\run.ps1`
- **macOS / Linux**: `./scripts/run.sh`

---

## Features

| Category | Feature | Details |
|----------|---------|---------|
| **LLM** | Multi-Provider | OpenAI, Gemini, Anthropic, Ollama, OpenRouter |
| **LLM** | Model Selection | Provider-driven dropdowns in Agent and Workflow builders |
| **Agents** | Agent Builder | System prompt, model picker, tools, memory, guardrails |
| **Agents** | Agent Templates | 10 pre-built templates (Research, Writing, Analysis, etc.) |
| **Agents** | Persistent Memory | Conversation history survives server restarts (DB-backed) |
| **Workflows** | Visual Canvas | ReactFlow with 5 node types (Agent, Router, Human-in-loop, Output, Note) |
| **Workflows** | Run Engine | LangGraph execution with WebSocket live event streaming |
| **Workflows** | Run Detail View | Agent timeline, event trace, token cost tracking |
| **Tools** | Built-in Tools | 13 tools: web_search, calculator, code_interpreter, CIRCL CVE, and more |
| **Tools** | Custom Tools | HTTP, Python, Webhook — create, parameterize, live-test |
| **Channels** | Telegram Integration | 3-step bot wizard with token validation and auto webhook setup |
| **UI/UX** | Theme System | Light/dark/system, 6 accent colors |
| **Observability** | Structured Logging | JSON logs with request IDs, audit trail |
| **Observability** | Event Streaming | Redis pub/sub with in-memory fallback |
| **Security** | API Authentication | Bearer token middleware (configurable) |
| **Security** | Rate Limiting | 10 req/min on /runs, 100/min on other endpoints |
| **Security** | SSRF Protection | DNS-based private IP blocklist |
| **Security** | Encryption at Rest | Fernet + PBKDF2 for provider API keys |
| **CI/CD** | Docker Compose | One-command deployment |
| **CI/CD** | GitHub Actions | Lint, test, build pipeline |

---

## Architecture Overview

```
React Frontend (React 19, ReactFlow, TanStack Query)
       │ REST + WebSocket
       ▼
FastAPI Backend (Python 3.13, asyncpg, Redis, LangGraph)
       │
  ┌────┴────┐     ┌─────┴─────┐
PostgreSQL 16     Redis 7 (pub/sub)
```

[Full Architecture →](ARCHITECTURE.md)

---

## Navigation (Onboarding Order)

```
⚡ Providers → 📋 Templates → 🔧 Tools → 🤖 Agents
→ 🔀 Workflows → 📡 Channels → ▶️ Runs → ⚙️ Settings
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React, TypeScript, Vite | React 19 / TS 5.7 |
| State | TanStack Query, Zustand | 5.62 / 5.0 |
| Canvas | ReactFlow | 11.11 |
| Styling | Tailwind CSS | 3.4 |
| Backend | Python, FastAPI, Uvicorn | 3.13 / 0.115 |
| Database | PostgreSQL, SQLAlchemy 2.0 | 16 / 2.0 |
| Cache | Redis 7 | 7 |
| Workflows | LangGraph | 0.2.60 |

---

## Prerequisites

- **Python 3.12+** (local dev) or **Docker** (containerized)
- **Node.js 22+** and **npm** (frontend dev)
- **PostgreSQL 16** (production) or SQLite (local dev)
- **Redis 7** (optional, falls back to in-memory)

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, design decisions, data flow |
| [API.md](API.md) | Full API reference with request/response examples |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Setup, testing, adding tools/channels/providers |
| [PROVIDERS.md](PROVIDERS.md) | Provider setup guide (OpenAI, Gemini, Anthropic, Ollama, OpenRouter) |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and solutions |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Coding standards, PR workflow, review checklist |
| [SECURITY.md](SECURITY.md) | Security policy, vulnerability reporting |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Security

- **API keys**: Encrypted at rest using Fernet + PBKDF2 (configurable ENCRYPTION_KEY)
- **Authentication**: Bearer token middleware (disabled when CEREBRA_API_KEY is empty)
- **SSRF protection**: DNS-based private IP blocklist in http_request tool
- **Code sandbox**: Restricted Python builtins for code_interpreter tool
- **Rate limiting**: Per-IP sliding window (configurable limits per route)
- **Request validation**: Pydantic v2 schemas on all endpoints

See [Security Review](ARCHITECTURE.md#security-architecture) for details.

---

## License

Proprietary. All rights reserved.
