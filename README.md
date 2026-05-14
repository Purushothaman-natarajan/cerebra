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
| **Agent Builder** | ✅ | System prompt, model, tools, memory, guardrails, provider+model selector |
| **Visual Workflow Canvas** | ✅ | ReactFlow with 5 node types: Agent, Router, Human Gate, Output, Note |
| **Node Config Panel** | ✅ | Click any canvas node → side panel shows type-specific config |
| **Template Library** | ✅ | 4 pre-built templates with import history tracking |
| **Custom Tools** | ✅ | HTTP, Python, Webhook — create, configure parameters, live test with input |
| **Tool Testing** | ✅ | Test custom tools with sample input/output, execution timing |
| **Run Engine** | ✅ | LangGraph-based execution with WebSocket live logging |
| **Run Detail View** | ✅ | Agent timeline, event trace, cost tracker, duration per agent |
| **Telegram Integration** | ✅ | 3-step bot setup wizard, webhook message routing |
| **Theme System** | ✅ | Light/dark/system modes, 6 accent colors (blue, purple, emerald, amber, rose, cyan) |
| **Responsive UI** | ✅ | Mobile hamburger sidebar, glass effects, page transitions |
| **Authentication** | ✅ | Bearer token middleware, WebSocket token param |
| **Rate Limiting** | ✅ | 10/min on runs, 100/min on other endpoints, 5MB max body |
| **SSRF Protection** | ✅ | DNS-based private IP blocklist on http_request tool |
| **Safe Eval** | ✅ | AST-based calculator parser — no `eval()` |
| **OpenAPI Docs** | ✅ | Swagger UI at /docs with per-field examples, response schemas, error codes |
| **CI/CD** | ⏸️ | GitHub Actions workflow (ready, triggers commented out) |

## Architecture

```
React Frontend (ReactFlow canvas, 9 pages, responsive, 14-component design system)
    │ REST + WebSocket (auth: Bearer token)
FastAPI Backend (auth middleware → 8 routers → 4 services → LangGraph)
    │ LangGraph StateGraph → CompiledGraph → Executor
Agent Runtime (5 node types, 4 built-in tools, guardrails, router conditions)
    │ Redis pub/sub (per-run event streaming)
PostgreSQL (agents, workflows, runs, events, providers, tools, channels)   Telegram Bot
```

## Navigation

```
Cerebra‑AI
  ⚡ Providers → 📋 Templates → 🔧 Tools → 🤖 Agents
  → 🔀 Workflows → 📡 Channels → ▶️ Runs → ⚙️ Settings
```

The sidebar order is the onboarding order. First-time users see a 5-step setup guide on Dashboard.

## Test Status

| Suite | Results |
|-------|---------|
| Backend unit tests | **34 pass**, 4 skip (need GEMINI_API_KEY) |
| Frontend component tests | **23 pass** (7 test files — vitest) |
| End-to-end API test | **16/16 pass** with real Gemini API |
| Frontend build | **0 TypeScript errors** |

## Remaining Items / Leftovers

| Priority | Item | Notes |
|----------|------|-------|
| Low | LangGraph `llm.py` sync client | Uses `client.models.generate_content()` sync (blocks event loop). Needs `aio` fix when SDK supports it |
| Low | `llm.py` tool calling disabled | SDK `generate_content()` does not accept `tools` or `system_instruction` params — prepended as user message instead |
| Low | DuckDuckGo web_search | Uses undocumented lite endpoint (fragile). Replace with Tavily/SerpAPI when available |
| Low | No schedule trigger | Workflow definition supports `trigger.type: "schedule"` but no APScheduler integration yet |
| Low | No human-in-the-loop | `HumanNode` frontend exists, backend `human_node.py` not implemented |
| Low | No conversation memory | `memory_enabled` field exists on agents but runtime does not implement memory persistence |
| Low | CI/CD commented out | GitHub Actions workflow ready. Uncomment `on:` block to activate |
| Low | Frontend chunk size | Some chunks >500KB (recharts + reactflow). Code-split with dynamic import() |

## Docs

- [Backend README](backend/README.md) — API reference, security, config, development
- [Frontend README](frontend/README.md) — component kit, pages, theming, testing
- [Developer Guide](DEVELOPER_GUIDE.md) — setup, testing, adding tools/channels/providers
- [Architecture](PLAN/ARCHITECTURE.md) — system design, data models, auth flow, security layers
- [Tech Stack](PLAN/TECHSTACK.md) — technology choices, versions, justifications
- [Project Roadmap](PLAN/ROADMAP.md) — build phases, completed milestones
- [Checklist](CHECKLIST.md) — bugs, fixes, test results
