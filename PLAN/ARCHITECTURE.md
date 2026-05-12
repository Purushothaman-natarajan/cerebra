# Architecture

## System Diagram

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

## Data Flow

1. User triggers workflow via UI or Telegram message
2. FastAPI `POST /runs` compiles the LangGraph workflow and enqueues execution
3. Executor runs each agent node; inter-agent messages travel via Redis pub/sub
4. Each step emits a `RunEvent` → WebSocket → UI live log panel
5. Final output returned to UI and/or Telegram thread

---

## Repo Structure

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
│   ├── alembic/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentBuilder/
│   │   │   │   ├── AgentForm.tsx
│   │   │   │   └── AgentCard.tsx
│   │   │   ├── WorkflowCanvas/
│   │   │   │   ├── Canvas.tsx         # ReactFlow wrapper
│   │   │   │   ├── AgentNode.tsx
│   │   │   │   ├── RouterNode.tsx
│   │   │   │   └── EdgeMenu.tsx       # Condition editor
│   │   │   ├── MonitorPanel/
│   │   │   │   ├── LiveLogs.tsx       # WebSocket log stream
│   │   │   │   ├── TokenChart.tsx
│   │   │   │   └── MessageTrace.tsx
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
│   │   ├── api/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── Dockerfile
│
├── templates/
│   ├── research_and_report.json
│   └── support_triage.json
│
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

---

## Data Models (Core)

### Agent
```json
{
  "id", "name", "role", "system_prompt",
  "model": "gpt-4o / claude-sonnet-4 / etc.",
  "tools": ["str"],
  "channel_id": "nullable FK → Channel",
  "memory_enabled": true,
  "max_iterations": 10,
  "guardrails": {
    "blocked_topics": ["str"],
    "max_tokens": 4096
  },
  "created_at", "updated_at"
}
```

### WorkflowDef
```json
{
  "id", "name",
  "nodes": [{ "id", "type", "agent_id", "config" }],
  "edges": [{ "source", "target", "condition" }],
  "trigger": { "type": "manual | schedule | channel", "config": {} }
}
```

### Run
```json
{
  "id", "workflow_id", "status",
  "started_at", "finished_at",
  "events": ["RunEvent"]
}
```

### RunEvent
```json
{
  "run_id", "timestamp", "type": "agent_start | tool_call | message | agent_end | error",
  "agent_id", "payload": {}
}
```

---

## Testing Strategy

| Test | Type | Coverage Target |
|------|------|-----------------|
| Agent CRUD | Unit | All fields, validation |
| WorkflowDef compile | Unit | Linear, conditional, loop graphs |
| Single-agent run | Integration | Tool call → output |
| Multi-agent run | Integration | State passing, router logic |
| Telegram delivery | Integration | Receive → trigger → reply |
| WebSocket stream | Integration | Events arrive in order |

Use `pytest-asyncio` + `httpx.AsyncClient` for FastAPI tests. Mock Telegram with `pytest-mock`; mock Redis with `fakeredis`.
