# Roadmap

> AI Agent Orchestration Platform — Yuno AI Hiring Challenge

## Goal

Build a production-grade, locally-runnable platform where:
- Users create and configure AI agents (model, role, tools, memory, guardrails)
- Agents are wired into visual multi-agent workflows with conditions and feedback loops
- At least one agent is reachable via **Telegram** (easiest OAuth-free setup)
- A web UI handles CRUD, the workflow canvas, and live monitoring
- Everything boots with `docker compose up`

## Evaluation Criteria

| Weight | Deliverable |
|--------|-------------|
| 40% | Working end-to-end demo (2+ agents, real task, Telegram) |
| 30% | Architecture + code quality |
| 20% | UI/UX + agent configurability |
| 10% | README + docs |

---

## Build Phases

### Phase 0 — Scaffold (Day 0, ~2h)
- Init repo, `docker-compose.yml` (postgres, redis, backend, frontend)
- FastAPI skeleton with health check
- Alembic init + base migrations
- React + Vite + shadcn/ui scaffold
- `.env.example`, `Makefile`

### Phase 1 — Agent CRUD + Runtime Core (Days 1–2)
- SQLAlchemy models: Agent, WorkflowDef, Run, RunEvent, Channel
- `/agents` CRUD endpoints + service
- Tool registry (web_search, calculator, http_request)
- `compiler.py` — WorkflowDef JSON → LangGraph CompiledGraph
- `executor.py` — run graph, emit `RunEvent` to Redis
- `agent_node.py` — LLM + tool call loop with guardrails
- **Tests**: agent CRUD, workflow compile, single-agent run

### Phase 2 — Multi-Agent & Async Messaging (Day 2–3)
- Redis pub/sub bus (`bus.py`)
- `router_node.py` — condition evaluation on graph edges
- Inter-agent message passing through shared LangGraph state
- `/runs` endpoints — trigger, status, event history
- WebSocket endpoint `/ws/runs/{run_id}` — stream RunEvents
- **Tests**: 2-agent workflow execution, message delivery reliability

### Phase 3 — Frontend (Days 3–4)
- AgentsPage — list, create, edit agents (form: model, tools, guardrails)
- WorkflowCanvas — ReactFlow canvas, custom AgentNode + RouterNode
- Edge condition editor (inline expression input)
- WorkflowsPage — load templates, save/load workflow JSON
- MonitorPanel — LiveLogs (WebSocket), TokenChart, MessageTrace
- RunsPage — run history table, click-to-expand event trace

### Phase 4 — Telegram + Channel Integration (Day 4–5)
- `TelegramChannel` class — webhook receive, reply
- `/channels` CRUD endpoints
- Bind a channel trigger to workflow start
- Message history persisted to DB + visible in UI
- `ngrok` setup instructions in README for local webhook
- **Tests**: Telegram message → workflow trigger → reply delivery

### Phase 5 — Templates, Polish & Demo (Day 5–6)
- Implement `research_and_report.json` template end-to-end
- Implement `support_triage.json` template end-to-end
- Token + cost tracking (inject LangChain callbacks)
- Schedule trigger (APScheduler)
- README: architecture diagram, setup guide, runtime justification, template extension guide
- Record demo video / GIF

---

## Pre-built Workflow Templates

### Template 1: Research & Report
```
[Telegram trigger: user query]
        ↓
  ResearchAgent         ← web_search tool
  (searches + summarizes)
        ↓
  WriterAgent           ← drafts markdown report
        ↓
  ReviewerAgent         ← fact-checks, scores confidence
        ↓
  [Reply to Telegram thread]
```

### Template 2: Support Triage
```
[Telegram trigger: support message]
        ↓
  TriageAgent           ← classifies: billing | technical | general
        ↓ (conditional edge on category)
    ┌───┴───┐
BillingAgent  TechAgent   GeneralAgent
    └───┬───┘
        ↓
  [Reply + log to DB]
```
