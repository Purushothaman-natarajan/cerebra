# Cerebra‑AI

AI Agent Orchestration Platform — multi-agent workflows with a visual canvas, multi-LLM provider support, custom tool building, Telegram integration, and a template library.

## Quick Start (Docker)

```bash
cp .env.example .env          # edit with your GEMINI_API_KEY
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs** (Swagger): http://localhost:8000/docs

## Quick Start (Local, no Docker)

### Prerequisites
- **Python 3.12+** and **Node.js 22+**
- **PostgreSQL 16** and **Redis 7** (or use SQLite for development)

### One-command run

**Windows (PowerShell 7+):**
```powershell
.\scripts\run.ps1
```

**Windows (CMD):**
```cmd
scripts\run.bat
```

**macOS / Linux:**
```bash
./scripts/run.sh
```

The script will:
1. Check prerequisites (Python, Node.js, uv)
2. Create `.env` from `.env.example` if missing
3. Start PostgreSQL + Redis via Docker (if available)
4. Install backend Python dependencies via `uv`
5. Install frontend npm dependencies
6. Start backend on port 8000
7. Start frontend on port 5173
8. Open the browser

### Manual setup

**Backend:**
```bash
cd backend
uv venv                    # create virtual environment
uv sync                    # install dependencies (or pip install -r requirements.txt)
cp ../.env.example .env    # configure settings
set DATABASE_URL=sqlite+aiosqlite:///./orchid.db   # use SQLite for dev
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Verify
```bash
curl http://localhost:8000/health
open http://localhost:8000/docs
```

## Features

| Category | Feature | Status | Details |
|----------|---------|--------|---------|
| **LLM** | Multi-Provider Support | ✅ | OpenAI, Gemini, Anthropic, Ollama, OpenRouter |
| **LLM** | Model Selection | ✅ | Provider-driven dropdowns in Agent and Workflow builders |
| **Agents** | Agent Builder | ✅ | System prompt, model picker, tools, memory, guardrails |
| **Agents** | Agent Templates | ✅ | 10 pre-built templates (Research, Writing, Analysis, Security, Support...) |
| **Agents** | Persistent Memory | ✅ | Conversation history survives server restarts (DB-backed) |
| **Workflows** | Visual Canvas | ✅ | ReactFlow with 5 node types (Agent, Router, Human-in-loop, Output, Note) |
| **Workflows** | Run Engine | ✅ | LangGraph execution with WebSocket live event streaming |
| **Workflows** | Run Detail View | ✅ | Agent timeline, event trace, token cost tracking |
| **Tools** | Built-in Tools | ✅ | 13 tools including web_search, calculator, code_interpreter, CIRCL CVE |
| **Tools** | Custom Tools | ✅ | HTTP, Python, Webhook — create, parameterize, live-test |
| **Channels** | Telegram Integration | ✅ | 3-step bot wizard with token validation and auto webhook setup |
| **UI/UX** | Theme System | ✅ | Light/dark/system, 6 accent colors |
| **Observability** | Structured Logging | ✅ | JSON logs with request IDs, audit trail |
| **Observability** | Event Streaming | ✅ | Redis pub/sub with in-memory fallback |
| **Security** | API Authentication | ✅ | Bearer token middleware |
| **Security** | Rate Limiting | ✅ | 10 req/min on /runs, 100/min on other endpoints |
| **Security** | SSRF Protection | ✅ | DNS-based private IP blocklist |
| **Security** | Encryption at Rest | ✅ | Fernet + PBKDF2 for provider API keys |
| **CI/CD** | Docker Compose | ✅ | One-command deployment |
| **CI/CD** | GitHub Actions | ✅ | Lint, test, build pipeline |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  React Frontend (React 19, ReactFlow, TanStack Query, Zustand)     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Dashboard │ │Providers │ │  Tools   │ │  Agents  │ │Workflows │ │
│  │   Page   │ │   Page   │ │   Page   │ │   Page   │ │ Canvas   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │Templates │ │ Channels │ │   Runs   │ │   14 UI Components   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ REST + WebSocket (Bearer token auth)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FastAPI Backend (Python 3.13, asyncpg, Redis, LangGraph)          │
│                                                                     │
│  Middleware: Auth → Rate Limit → Request ID → Structured Logging    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  API Routers (35+ endpoints across 10 route files)          │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                      │
│  ┌──────────────────────────┴──────────────────────────────────┐   │
│  │  Services Layer (CRUD, business logic, token tracking)      │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                      │
│  ┌──────────────────────────┴──────────────────────────────────┐   │
│  │  Runtime Layer (LangGraph StateGraph → CompiledGraph)       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │   │
│  │  │ Compiler │ │Executor  │ │ LLM      │ │ Tools        │   │   │
│  │  │ (Graph)  │ │(run_work)│ │ (Gemini) │ │ Registry(13) │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                      │
│  ┌──────────────────────────┴──────────────────────────────────┐   │
│  │  Data Layer (9 SQLAlchemy ORM models, asyncpg/aiosqlite)    │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
               ┌────┴────┐         ┌─────┴─────┐
               │PostgreSQL│         │   Redis   │
               │ (asyncpg)│         │ (pub/sub) │
               └─────────┘         └───────────┘
```

## Navigation (Onboarding Order)

```
⚡ Providers → 📋 Templates → 🔧 Tools → 🤖 Agents
→ 🔀 Workflows → 📡 Channels → ▶️ Runs → ⚙️ Settings
```

The sidebar follows the natural onboarding flow. First-time users see a 5-step setup guide on the Dashboard.

## Prerequisites

- **Python 3.12+** (local dev) or **Docker** (containerized)
- **Node.js 22+** and **npm** (frontend dev)
- **PostgreSQL 16** (production) or SQLite (local dev)
- **Redis 7** (optional, falls back to in-memory)

## Local Development

### One-command scripts (recommended)

The `scripts/` directory contains platform-specific launchers that handle everything:

| Platform | Command |
|----------|---------|
| **Windows (PowerShell 7+)** | `.\scripts\run.ps1` |
| **Windows (CMD)** | `scripts\run.bat` |
| **macOS / Linux** | `./scripts/run.sh` |

These scripts automatically:
1. Check prerequisites (Python 3.12+, Node.js 22+, uv package manager)
2. Create `.env` from `.env.example` if missing
3. Start PostgreSQL + Redis via Docker (if available)
4. Install backend and frontend dependencies
5. Start both servers with hot-reload
6. Open the browser

### Manual backend setup

```bash
cd backend
uv venv                      # create virtual environment
uv sync                      # install dependencies
# Or with pip: pip install -r requirements.txt

cp ../.env.example .env      # edit with your settings
# Use SQLite for development (no PostgreSQL needed):
set DATABASE_URL=sqlite+aiosqlite:///./orchid.db   # Windows
export DATABASE_URL=sqlite+aiosqlite:///./orchid.db   # macOS/Linux

uv run uvicorn app.main:app --reload --port 8000
```

### Manual frontend setup

```bash
cd frontend
npm install
npm run dev
```

### Verify

```bash
curl http://localhost:8000/health
# → {"status":"healthy","service":"cerebra-backend","version":"0.2.0",...}

open http://localhost:8000/docs   # Swagger UI
open http://localhost:5173        # Frontend
```

## Telegram Bot Setup

### How it works

Telegram bots connect via a webhook URL that Telegram sends updates (messages) to.
For local development, you need a public HTTPS URL — **ngrok** provides this for free.

### Step-by-step

**1. Create a bot on Telegram**
- Open Telegram and search for `@BotFather`
- Send `/newbot` and follow the prompts
- Copy the API token (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

**2. Start ngrok**
```bash
ngrok http 8000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.dev`)

**3. Connect in the app**
- Go to **Channels** → **Add Channel**
- Paste your bot token → click **Test Connection** (validates against Telegram API)
- Enter your ngrok URL (e.g., `https://abc123.ngrok.dev`)
- Select a workflow to trigger on incoming messages
- Click **Finish Setup** — the backend auto-registers the webhook with Telegram

### Troubleshooting

| Error | Meaning | Fix |
|-------|---------|-----|
| `Bot token rejected by Telegram` | Token is invalid or bot was deleted | Create a new bot via @BotFather |
| `Cannot reach Telegram API` | Network issue or Telegram is blocked | Check internet connection, firewall, proxy |
| `Webhook URL must use HTTPS` | ngrok URL missing or HTTP used | Use `https://` from ngrok, not `http://` |
| `No channel configured` | Webhook received but no bot set up | Complete the 3-step setup first |

### Manual webhook registration

If you prefer to set the webhook manually:
```bash
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-ngrok-url.ngrok.dev/api/channels/webhook/telegram"}'
```

Verify the webhook is set:
```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

| Suite | Results | Notes |
|-------|---------|-------|
| Backend pytest | **39 passed, 3 skipped** | Skips need Gemini API key |
| Frontend vitest | **12 test files** | Component tests |
| Frontend build | **0 errors** | `tsc && vite build` |
| API integration | **16/16 pass** | End-to-end with test client |

## Project Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, design decisions, data flow |
| [API_DOCS.md](API_DOCS.md) | Full API reference with request/response examples |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Setup, testing, adding tools/channels/providers |
| [SECURITY.md](SECURITY.md) | Security policy, vulnerability reporting |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React, TypeScript, Vite | 19 / 5.7 / 6.4 |
| State | TanStack Query, Zustand | 5.62 / 5.0 |
| Canvas | ReactFlow | 11.11 |
| Styling | Tailwind CSS, CSS Variables | 3.4 |
| Backend | Python, FastAPI, Uvicorn | 3.13 / 0.115 / 0.34 |
| Database | PostgreSQL, SQLAlchemy 2.0, asyncpg | 16 / 2.0 / 0.30 |
| Cache | Redis | 7 |
| Workflows | LangGraph | 0.2.60 |
| LLM | Gemini (REST API) | — |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, PR workflow, and review checklist.

## Security

- **API keys**: Encrypted at rest using Fernet + PBKDF2 (configurable ENCRYPTION_KEY)
- **Authentication**: Bearer token middleware (disabled when CEREBRA_API_KEY is empty)
- **SSRF protection**: DNS-based private IP blocklist in http_request tool
- **Code sandbox**: Restricted Python builtins for code_interpreter tool
- **Rate limiting**: Per-IP sliding window (configurable limits per route)
- **Request validation**: Pydantic v2 schemas on all endpoints
- See [Security Review](ARCHITECTURE.md#security-architecture) for details.

## License

Proprietary. All rights reserved.
