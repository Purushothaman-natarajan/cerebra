# AI Agent Orchestration Platform — Project Plan

> Yuno AI · Hiring Challenge · Purushothaman

---

## 1. Goal

Build a production-grade, locally-runnable platform where:
- Users create and configure AI agents (model, role, tools, memory, guardrails)
- Agents are wired into visual multi-agent workflows with conditions and feedback loops
- At least one agent is reachable via **Telegram** (easiest OAuth-free setup)
- A web UI handles CRUD, the workflow canvas, and live monitoring
- Everything boots with `docker compose up`

**Evaluation priority mapping:**
| Weight | Deliverable |
|--------|-------------|
| 40% | Working end-to-end demo (2+ agents, real task, Telegram) |
| 30% | Architecture + code quality |
| 20% | UI/UX + agent configurability |
| 10% | README + docs |

---

## 2. Tech Stack & Justifications

### Backend — Python / FastAPI

- FastAPI for async REST + WebSocket (real-time log streaming to UI)
- **Justification**: Async-first, excellent typing, OpenAPI docs for free

### AI Runtime — LangGraph

- **Why LangGraph over CrewAI/AutoGen:**
  - Graph = direct semantic match to "visual workflow builder with conditions + feedback loops"
  - Native `StateGraph` checkpointing = agent memory out of the box
  - `interrupt_before` / `interrupt_after` = human-in-the-loop slots
  - Each node is a plain Python function → easy to unit test
  - Production-ready (used internally at LangChain)
- Agents run as LangGraph `CompiledGraph` instances, persisted to Postgres via `langgraph-checkpoint-postgres`

### Frontend — React + TypeScript

- **ReactFlow** for the visual workflow canvas (node-edge graph, drag-and-drop)
- **Zustand** for global state
- **TanStack Query** for data fetching / cache
- **shadcn/ui + Tailwind** for UI components
- **Recharts** for token/cost monitoring charts

### Persistence — PostgreSQL + Redis

| Store | Purpose |
|-------|---------|
| PostgreSQL | Agents, workflows, message history, run logs |
| Redis | Async message bus between agents (pub/sub), task queue |

### Messaging Channel — Telegram

- `python-telegram-bot` (async)
- **Why Telegram**: No business account, no phone verification for bot creation, webhook setup in <5 min with `ngrok` locally
- WhatsApp requires Meta Business account (days of approval); Slack requires workspace admin

### Infrastructure

- `docker-compose.yml` — single command boot
- `make dev` shortcut for local dev without Docker
- `.env.example` — all secrets documented

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│  AgentBuilder │ WorkflowCanvas (ReactFlow) │ MonitorPanel   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST + WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend                           │
│                                                              │
│  /agents    /workflows    /runs    /channels    /ws/logs     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Agent Runtime Layer (LangGraph)          │   │
│  │  WorkflowCompiler → CompiledGraph → Executor          │   │
│  │  AgentNode (LLM + tools) + RouterNode + HumanNode    │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │           Message Bus (Redis pub/sub)                 │   │
│  │   inter-agent async messages + run event stream       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
             ┌─────────────┴──────────────┐
             │                            │
    ┌────────▼────────┐         ┌─────────▼─────────┐
    │   PostgreSQL    │         │  Telegram Bot      │
    │  (state +       │         │  (channel bridge)  │
    │   history)      │         └───────────────────-┘
    └─────────────────┘
```

**Data flow for a multi-agent task:**
1. User triggers workflow via UI or Telegram message
2. FastAPI `POST /runs` compiles the LangGraph workflow and enqueues execution
3. Executor runs each agent node; inter-agent messages travel via Redis pub/sub
4. Each step emits a `RunEvent` → WebSocket → UI live log panel
5. Final output returned to UI and/or Telegram thread

---

## 4. Repo Structure

```
agent-platform/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agents.py          # CRUD endpoints
│   │   │   ├── workflows.py       # CRUD + compile
│   │   │   ├── runs.py            # Trigger + status
│   │   │   ├── channels.py        # Channel config
│   │   │   └── ws.py              # WebSocket log stream
│   │   │
│   │   ├── runtime/
│   │   │   ├── compiler.py        # WorkflowDef → LangGraph CompiledGraph
│   │   │   ├── executor.py        # Run graph, emit events to Redis
│   │   │   ├── nodes/
│   │   │   │   ├── agent_node.py  # LLM + tool call loop
│   │   │   │   ├── router_node.py # Conditional edge logic
│   │   │   │   └── human_node.py  # Interrupt + resume
│   │   │   └── tools/
│   │   │       ├── registry.py    # Tool catalog
│   │   │       ├── web_search.py
│   │   │       ├── calculator.py
│   │   │       └── http_request.py
│   │   │
│   │   ├── channels/
│   │   │   ├── base.py            # AbstractChannel
│   │   │   └── telegram.py        # TelegramChannel (webhook handler)
│   │   │
│   │   ├── models/
│   │   │   ├── agent.py           # SQLAlchemy Agent model
│   │   │   ├── workflow.py        # Workflow + WorkflowEdge models
│   │   │   ├── run.py             # Run + RunEvent models
│   │   │   └── message.py        # ChannelMessage model
│   │   │
│   │   ├── services/
│   │   │   ├── agent_service.py
│   │   │   ├── workflow_service.py
│   │   │   └── run_service.py
│   │   │
│   │   ├── db.py                  # SQLAlchemy async session
│   │   ├── bus.py                 # Redis pub/sub wrapper
│   │   ├── config.py              # Pydantic settings
│   │   └── main.py                # FastAPI app entry
│   │
│   ├── tests/
│   │   ├── test_agent_crud.py
│   │   ├── test_workflow_compile.py
│   │   ├── test_run_execution.py
│   │   └── test_telegram_delivery.py
│   │
│   ├── alembic/                   # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentBuilder/
│   │   │   │   ├── AgentForm.tsx      # Create/edit agent
│   │   │   │   └── AgentCard.tsx
│   │   │   ├── WorkflowCanvas/
│   │   │   │   ├── Canvas.tsx         # ReactFlow wrapper
│   │   │   │   ├── AgentNode.tsx      # Custom node renderer
│   │   │   │   ├── RouterNode.tsx
│   │   │   │   └── EdgeMenu.tsx       # Condition editor
│   │   │   ├── MonitorPanel/
│   │   │   │   ├── LiveLogs.tsx       # WebSocket log stream
│   │   │   │   ├── TokenChart.tsx     # Recharts cost tracker
│   │   │   │   └── MessageTrace.tsx   # Inter-agent message trace
│   │   │   └── ChannelConfig/
│   │   │       └── TelegramSetup.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── AgentsPage.tsx
│   │   │   ├── WorkflowsPage.tsx
│   │   │   ├── RunsPage.tsx
│   │   │   └── ChannelsPage.tsx
│   │   │
│   │   ├── store/
│   │   │   ├── agentStore.ts
│   │   │   └── runStore.ts
│   │   │
│   │   ├── api/                   # TanStack Query hooks
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── Dockerfile
│
├── templates/                     # Pre-built workflow JSON templates
│   ├── research_and_report.json   # ResearchAgent → WriterAgent → ReviewerAgent
│   └── support_triage.json        # TriageAgent → SpecialistAgent (Telegram-triggered)
│
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

---

## 5. Data Models (Core)

```python
# Agent
{
  id, name, role, system_prompt,
  model,           # gpt-4o / claude-sonnet-4 / etc.
  tools: [str],    # from tool registry
  channel_id,      # nullable FK → Channel
  memory_enabled: bool,
  max_iterations: int,
  guardrails: {    # output filters, topic restrictions
    blocked_topics: [str],
    max_tokens: int
  },
  created_at, updated_at
}

# WorkflowDef
{
  id, name,
  nodes: [{ id, type, agent_id, config }],
  edges: [{ source, target, condition }],  # condition = Python expr string
  trigger: { type: "manual" | "schedule" | "channel", config: {} }
}

# Run
{
  id, workflow_id, status,
  started_at, finished_at,
  events: [RunEvent]  # serialized to DB, streamed via WS
}

# RunEvent
{
  run_id, timestamp, type,   # agent_start | tool_call | message | agent_end | error
  agent_id, payload: dict
}
```

---

## 6. Pre-built Workflow Templates

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

---

## 7. Build Roadmap

### Phase 0 — Scaffold (Day 0, ~2h)
- [ ] Init repo, `docker-compose.yml` (postgres, redis, backend, frontend)
- [ ] FastAPI skeleton with health check
- [ ] Alembic init + base migrations
- [ ] React + Vite + shadcn/ui scaffold
- [ ] `.env.example`, `Makefile`

### Phase 1 — Agent CRUD + Runtime Core (Days 1–2)
- [ ] SQLAlchemy models: Agent, WorkflowDef, Run, RunEvent, Channel
- [ ] `/agents` CRUD endpoints + service
- [ ] Tool registry (web_search, calculator, http_request)
- [ ] `compiler.py` — WorkflowDef JSON → LangGraph CompiledGraph
- [ ] `executor.py` — run graph, emit `RunEvent` to Redis
- [ ] `agent_node.py` — LLM + tool call loop with guardrails
- [ ] **Tests**: agent CRUD, workflow compile, single-agent run

### Phase 2 — Multi-Agent & Async Messaging (Day 2–3)
- [ ] Redis pub/sub bus (`bus.py`)
- [ ] `router_node.py` — condition evaluation on graph edges
- [ ] Inter-agent message passing through shared LangGraph state
- [ ] `/runs` endpoints — trigger, status, event history
- [ ] WebSocket endpoint `/ws/runs/{run_id}` — stream RunEvents
- [ ] **Tests**: 2-agent workflow execution, message delivery reliability

### Phase 3 — Frontend (Days 3–4)
- [ ] AgentsPage — list, create, edit agents (form: model, tools, guardrails)
- [ ] WorkflowCanvas — ReactFlow canvas, custom AgentNode + RouterNode
- [ ] Edge condition editor (inline expression input)
- [ ] WorkflowsPage — load templates, save/load workflow JSON
- [ ] MonitorPanel — LiveLogs (WebSocket), TokenChart, MessageTrace
- [ ] RunsPage — run history table, click-to-expand event trace

### Phase 4 — Telegram + Channel Integration (Day 4–5)
- [ ] `TelegramChannel` class — webhook receive, reply
- [ ] `/channels` CRUD endpoints
- [ ] Bind a channel trigger to workflow start
- [ ] Message history persisted to DB + visible in UI
- [ ] `ngrok` setup instructions in README for local webhook
- [ ] **Tests**: Telegram message → workflow trigger → reply delivery

### Phase 5 — Templates, Polish & Demo (Day 5–6)
- [ ] Implement `research_and_report.json` template end-to-end
- [ ] Implement `support_triage.json` template end-to-end
- [ ] Token + cost tracking (inject `LangChain callbacks`)
- [ ] Schedule trigger (APScheduler)
- [ ] README: architecture diagram, setup guide, runtime justification, template extension guide
- [ ] Record demo video / GIF

---

## 8. Key Implementation Notes

### Compiler — WorkflowDef → LangGraph

```python
# compiler.py sketch
def compile_workflow(wf: WorkflowDef) -> CompiledGraph:
    builder = StateGraph(WorkflowState)
    for node in wf.nodes:
        if node.type == "agent":
            builder.add_node(node.id, AgentNode(agent_id=node.agent_id))
        elif node.type == "router":
            builder.add_node(node.id, RouterNode(conditions=node.config))
    for edge in wf.edges:
        if edge.condition:
            builder.add_conditional_edges(
                edge.source,
                eval_condition(edge.condition),   # safe eval via restricted AST
                {True: edge.target, False: edge.fallback}
            )
        else:
            builder.add_edge(edge.source, edge.target)
    builder.set_entry_point(wf.entry_node)
    return builder.compile(
        checkpointer=PostgresSaver(connection_pool)
    )
```

### Async Inter-Agent Messaging

Agents share `WorkflowState` (LangGraph's state dict) — messages are appended to a `messages: list` key. Redis pub/sub is used for **cross-run** notifications and UI event streaming only. No need for a separate message broker for same-graph agents.

### Guardrails

Implement as a post-LLM hook in `agent_node.py`:
- Blocked topic check (keyword scan + optional secondary LLM judge)
- Max token budget enforcement
- Output schema validation via Pydantic

---

## 9. Testing Strategy

| Test | Type | Coverage target |
|------|------|-----------------|
| Agent CRUD | Unit | All fields, validation |
| WorkflowDef compile | Unit | Linear, conditional, loop graphs |
| Single-agent run | Integration | Tool call → output |
| Multi-agent run | Integration | State passing, router logic |
| Telegram delivery | Integration | Receive → trigger → reply |
| WebSocket stream | Integration | Events arrive in order |

Use `pytest-asyncio` + `httpx.AsyncClient` for FastAPI tests.
Mock Telegram with `pytest-mock`; mock Redis with `fakeredis`.

---

## 10. README Sections

1. Architecture diagram (mermaid)
2. Tech stack + justifications (LangGraph, FastAPI, ReactFlow, Telegram)
3. Setup — `cp .env.example .env && docker compose up`
4. Telegram bot setup + ngrok webhook
5. Runtime choice justification
6. Adding a new workflow template
7. Adding a new messaging channel
8. Demo video link
