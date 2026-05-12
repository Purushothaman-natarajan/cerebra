# Tech Stack

## Backend — Python / FastAPI

- FastAPI for async REST + WebSocket (real-time log streaming to UI)
- **Why**: Async-first, excellent typing, OpenAPI docs for free

## AI Runtime — LangGraph

- **Why LangGraph over CrewAI/AutoGen:**
  - Graph = direct semantic match to "visual workflow builder with conditions + feedback loops"
  - Native `StateGraph` checkpointing = agent memory out of the box
  - `interrupt_before` / `interrupt_after` = human-in-the-loop slots
  - Each node is a plain Python function → easy to unit test
  - Production-ready (used internally at LangChain)
- Agents run as LangGraph `CompiledGraph` instances, persisted to Postgres via `langgraph-checkpoint-postgres`

## Frontend — React + TypeScript

- **ReactFlow** for the visual workflow canvas (node-edge graph, drag-and-drop)
- **Zustand** for global state
- **TanStack Query** for data fetching / cache
- **shadcn/ui + Tailwind** for UI components
- **Recharts** for token/cost monitoring charts

## Persistence — PostgreSQL + Redis

| Store | Purpose |
|-------|---------|
| PostgreSQL | Agents, workflows, message history, run logs |
| Redis | Async message bus between agents (pub/sub), task queue |

## Messaging Channel — Telegram

- `python-telegram-bot` (async)
- **Why Telegram**: No business account, no phone verification for bot creation, webhook setup in <5 min with `ngrok` locally
- WhatsApp requires Meta Business account (days of approval); Slack requires workspace admin

## Infrastructure

- `docker-compose.yml` — single command boot
- `make dev` shortcut for local dev without Docker
- `.env.example` — all secrets documented

---

## Key Implementation Notes

### Compiler — WorkflowDef → LangGraph

```python
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
                eval_condition(edge.condition),
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
