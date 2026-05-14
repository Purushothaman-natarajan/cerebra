# Orchid — Project Roadmap

> AI Agent Orchestration Platform · Yuno AI Hiring Challenge · Purushothaman

---

## Goal

Build a production-grade, locally-runnable platform where:
- Users create and configure AI agents (model, role, tools, memory, guardrails)
- Agents are wired into visual multi-agent workflows with conditions and feedback loops
- At least one agent is reachable via **Telegram**
- A web UI handles CRUD, the workflow canvas, and live monitoring
- Everything boots with `docker compose up`

---

## Design Philosophy (UX)

- **Progressive disclosure** — simple things are simple; complex things are possible
- **Build once, reuse everywhere** — LLM configs, tools, agents are assets, not one-offs
- **Visible state at all times** — user always knows what's running, what failed, why
- **Zero dead ends** — every empty state has a next action; every error has a recovery path

---

## Build Phases

### Phase 0 — Scaffold
- [x] Init repo, `docker-compose.yml` (postgres, redis, backend, frontend)
- [x] FastAPI skeleton with health check
- [x] Alembic init + base migration config
- [x] React + Vite + Tailwind scaffold
- [x] `.env.example`, `Makefile`

### Phase 1 — Agent CRUD + Runtime Core
- [x] SQLAlchemy models: Agent, WorkflowDef, Run, RunEvent, Channel
- [x] `/agents` CRUD endpoints + service
- [x] Tool registry (web_search, calculator, http_request)
- [x] `compiler.py` — WorkflowDef JSON → LangGraph CompiledGraph
- [x] `executor.py` — run graph, emit RunEvent to Redis
- [x] `agent_node.py` — LLM + tool call loop with guardrails
- [x] **Tests**: agent CRUD, workflow compile, single-agent run

### Phase 2 — Multi-Agent & Async Messaging
- [x] Redis pub/sub bus (`bus.py`)
- [x] `router_node.py` — keyword-based condition evaluation
- [x] Inter-agent message passing through shared LangGraph state
- [x] `/runs` endpoints — trigger, status, event history
- [x] WebSocket endpoint `/ws/runs/{run_id}`
- [x] **Tests**: 2-agent workflow, router decision

### Phase 3 — Frontend (Initial)
- [x] AgentsPage — list, create, edit agents
- [x] WorkflowCanvas — ReactFlow canvas with AgentNode + RouterNode
- [x] Edge condition editor
- [x] WorkflowsPage — save/load workflow JSON
- [x] MonitorPanel — LiveLogs (WebSocket), MessageTrace
- [x] RunsPage — run history table

### Phase 4 — Telegram + Channel Integration
- [x] `TelegramChannel` class — webhook receive, reply
- [x] `/channels` CRUD endpoints
- [x] Bind channel trigger to workflow start
- [x] Message history persisted to DB

### Phase 5 — Templates, Polish & Demo
- [x] Implement `research_and_report.json`, `support_triage.json`, `web_research_agent.json`
- [x] Token + cost tracking placeholder
- [x] README: architecture, setup, tech choices
- [ ] Record demo video / GIF

### Phase 6 — Security Hardening
- [x] **Safe eval**: AST-based calculator (no `eval()`)
- [x] **SSRF protection**: Private IP blocklist + async DNS resolution
- [x] **CORS**: Configurable origins
- [x] **Auth**: Bearer token middleware + WS token param
- [x] **Encryption**: Fernet encryption for provider API keys
- [x] **Rate limiting**: In-memory sliding window (10/min runs, 100/min other)
- [x] **Input validation**: Pydantic Field limits, 5MB body middleware
- [x] **nginx headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [x] **Error sanitization**: Generic error messages to LLM (no stack leaks)
- [x] **Redis password**: Support via REDIS_PASSWORD env var
- [x] **WebSocket origin**: Origin header validation
- [x] **Git hygiene**: `.gitignore` expanded, `.dockerignore` for both projects

### Phase 7 — Orchid UX Redesign
- [x] App shell: rename to Orchid, reorder sidebar, responsive hamburger menu
- [x] Theme: light/dark/system toggle, 6 accent colors, CSS variable system
- [x] Component kit: Button, Input, Card, Badge, Dialog, Toast, Skeleton, Empty
- [x] **Providers**: Cards with model list, masked key, Verified badge, Test Connection
- [x] **Tools**: Grid layout with icons, "Create custom tool" card, 3 creation paths
- [x] **Agents**: Emoji avatars, redesigned cards with role + memory + model
- [x] **Workflows**: List cards with run/duplicate/delete, template 3-step wizard
- [x] **Channels**: 3-step Telegram wizard (create bot, configure webhook, route)
- [x] **Runs**: Filterable list, detail view with timeline + log + events + cost
- [x] **Settings**: General, Execution, Notifications, Danger zone
- [x] Onboarding banner (5-step setup when no data exists)
- [x] Empty states, error boundaries, toast notifications
- [x] Dead code removed: TokenChart, useRunStore

---

## Tech Stack

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| **Backend** | Python / FastAPI | Async-native for concurrent LLM calls, auto OpenAPI docs |
| **AI Runtime** | LangGraph | Graph = semantic match to visual workflows with conditionals |
| **LLM** | Gemini (swappable) | Provider system: OpenAI, Anthropic, Ollama, OpenRouter |
| **Database** | PostgreSQL + SQLite (dev) | JSON columns for flexible node/edge/tool definitions |
| **Messaging** | Redis pub/sub | Lightweight event streaming to WebSocket clients |
| **Frontend** | React 19 + TypeScript | Zustand, TanStack Query, ReactFlow, Tailwind |
| **Infra** | Docker Compose | Single command boot |

## Site Navigation (UX)

```
🌸 Orchid
─────────────
⚡ Providers       ← Step 1: your LLM keys
🔧 Tools           ← Step 2: what agents can do
🤖 Agents          ← Step 3: who does the work
🔀 Workflows       ← Step 4: how they collaborate
📡 Channels        ← Step 5: how the outside world talks in
▶️ Runs            ← Live + history
⚙️ Settings
```

The sidebar order **is the onboarding order**. First-time users see a 5-step setup banner on the Dashboard.
