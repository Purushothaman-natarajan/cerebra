# Architecture Guide

## Overview

Cerebra-AI is a multi-agent orchestration platform that enables users to create, configure, and execute complex AI workflows using a visual canvas. It combines a React frontend with a FastAPI backend, using LangGraph for workflow execution and Redis for real-time event streaming.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Providers│ │  Tools   │ │  Agents  │ │   Workflows      │   │
│  │   Page   │ │   Page   │ │   Page   │ │   Canvas + Run   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │            │            │                │             │
│  ┌────┴────────────┴────────────┴────────────────┴─────────┐   │
│  │              TanStack React Query Cache                  │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                  │
│              ┌──────────────┴──────────────┐                   │
│              │    apiFetch + Logger        │                   │
│              └──────────────┬──────────────┘                   │
└─────────────────────────────┼─────────────────────────────────┘
                              │ HTTP (port 5173)
                              │ Vite Dev Proxy → port 8000
                              │ NGINX Prod Proxy → backend:8000
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                             │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  Auth       │  │  Rate Limit  │  │  Request ID + Logging │   │
│  │  Middleware  │  │  Middleware  │  │  Middleware            │   │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬───────────┘   │
│         │                │                      │               │
│  ┌──────┴────────────────┴──────────────────────┴───────────┐   │
│  │                    API Routers                            │   │
│  │  /agents  /tools  /workflows  /runs  /providers          │   │
│  │  /channels  /templates  /agent-templates  /logs  /ws     │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                      │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │                    Services Layer                        │   │
│  │  agent_service  tool_service  run_service  provider_svc  │   │
│  │  workflow_service  log_service  agent_template_service  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                      │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │                    Runtime Layer                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │  │ Compiler │ │Executor  │ │   LLM    │ │  Tools   │    │   │
│  │  │(LangGraph)│ │(run_work)│ │(Gemini)  │ │ Registry │    │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                      │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │         Data Layer (SQLAlchemy + asyncpg)                │   │
│  │  agents │ tools │ workflows │ runs │ providers │ logs   │   │
│  │  channels │ agent_templates │ run_events                 │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         ┌────┴────┐           ┌──────┴──────┐
         │PostgreSQL│           │    Redis    │
         │ (asyncpg)│           │  (pub/sub)  │
         └─────────┘           └─────────────┘
```

## Data Flow

### Workflow Execution
1. **User creates workflow** via the ReactFlow canvas or imports a template
2. **POST /workflows** saves the workflow definition (nodes + edges) to PostgreSQL
3. **POST /runs** triggers execution with optional input message
4. **run_service.create_run()** creates a Run record (status=pending)
5. **executor.run_workflow()** compiles the workflow into a LangGraph StateGraph
6. **graph.ainvoke()** executes nodes sequentially with conditional routing
7. Each node/agent publishes events (agent_start, tool_call, message) to Redis
8. **WebSocket clients** (LiveLogs component) subscribe to `run:events:{run_id}`
9. On completion, token usage and cost are persisted

### Live Event Streaming
```
Frontend WS ──► Backend ──► Redis Pub/Sub ──► Executor publishes events
  ◄── JSON events streamed back to frontend in real-time
```

### Provider-LLM Integration
```
User configures provider ──► POST /providers ──► Test connection
  └── Models stored in DB ──► AgentForm/NodeConfig populate dropdown
  └── At runtime: llm.py uses GEMINI_API_KEY (single provider)
  └── TODO: Provider-aware LLM router (see Known Debt)
```

## Design Decisions

### Why LangGraph over direct LLM calls?
- Enables complex multi-agent topologies (chains, routers, loops)
- Built-in conditional routing with fallback support
- Human-in-the-loop nodes for approval workflows

### Why Redis + in-memory fallback for event bus?
- Real-time event streaming requires pub/sub semantics
- In-memory fallback ensures single-instance development works without Redis
- Production deployments can scale with Redis Cluster

### Why Gemini REST API vs SDK?
- The google-genai SDK doesn't support `system_instruction` and `tools` in `generate_content()`
- Direct REST API calls provide full control over request/response format
- Trade-off: provider-specific implementation (see Known Debt)

### Why SQLAlchemy 2.0 async?
- Native async support avoids thread pool contention
- Automatic connection pooling with configurable pool size
- Support for both PostgreSQL and SQLite (dev)

## Component Detail

### Backend Modules

| Module | Responsibility | Key Classes/Functions |
|--------|---------------|----------------------|
| `api/` | HTTP route handlers | ~35 endpoints across 10 routers |
| `models/` | SQLAlchemy ORM models | 9 tables (agents, workflows, runs, etc.) |
| `services/` | Business logic | CRUD + test agent + token tracking |
| `runtime/` | Workflow execution | Executor, Compiler, LLM client, Tools |
| `channels/` | External integrations | Telegram bot channel |
| `bus.py` | Event pub/sub | Redis + in-memory fallback |
| `auth.py` | API auth | Bearer token or no-auth mode |
| `ratelimit.py` | Rate limiting | In-memory sliding window |
| `security.py` | Encryption | Fernet + PBKDF2 key derivation |
| `scheduler.py` | Cron workflows | APScheduler polling every 60s |

### Frontend Modules

| Module | Responsibility |
|--------|---------------|
| `api/` | HTTP client + React Query hooks |
| `pages/` | 9 page-level components |
| `components/ui/` | Reusable design system (16 components) |
| `components/*/` | Domain-specific components |
| `store/` | Zustand state for agent form |
| `contexts/` | Theme context (light/dark + 6 accents) |

## Scaling Considerations

### Current Limits
- **Single Python process** for workflow execution (blocking during long runs)
- **In-memory rate limiter** doesn't work across multiple instances
- **In-memory conversation history** lost on restart
- **Gemini-only LLM routing** limits provider flexibility

### Horizontal Scaling Path
1. Move rate limiting to Redis (sliding window or token bucket)
2. Replace in-memory conversation history with Redis/DB persistence
3. Add task queue (Celery/Redis Queue) for async workflow execution
4. Implement provider-aware LLM routing with fallback chains
5. Add read replicas for PostgreSQL queries

## Known Technical Debt

| Issue | Impact | Priority |
|-------|--------|----------|
| LLM only supports Gemini (hardcoded REST API) | All models selected in UI call Gemini | **Critical** |
| No request timeout for long-running workflows | Workflow may hang indefinitely | **High** |
| Alembic migrations exist but not run on startup | Schema drift between environments | **High** |
| No connection pooling for Redis | Reconnects on every publish | **Medium** |
| Conversation memory is in-process only | Lost on restart, not shared across instances | **Medium** |
| Rate limiter is in-memory | Won't work behind load balancer | **Medium** |
| No metrics/opentelemetry integration | No observability in production | **Medium** |
| Test coverage is low for services layer | Regression risk | **Medium** |

## Security Architecture

```
Client Request
    │
    ▼
CORS Middleware ───► Origin whitelist check
    │
    ▼
Auth Middleware ───► Bearer token or public path check
    │
    ▼
Rate Limiter ───► Sliding window (per IP + path)
    │
    ▼
Request ID ───► Trace ID assigned, logged
    │
    ▼
API Handler ───► Input validated via Pydantic schemas
    │
    ▼
Service Layer
    │
    ▼
Database ───► ORM with parameterized queries (no SQL injection)
```

## Deployment Topology

```
                          ┌─────────────┐
                          │   CDN/ LB   │
                          └──────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
        ┌─────┴─────┐     ┌─────┴─────┐     ┌──────┴──────┐
        │ Frontend  │     │ Frontend  │     │ Frontend    │
        │ (Nginx)   │     │ (Nginx)   │     │ (Nginx)     │
        └─────┬─────┘     └─────┬─────┘     └──────┬──────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Load Balancer         │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
        ┌─────┴─────┐     ┌─────┴─────┐     ┌──────┴──────┐
        │ Backend   │     │ Backend   │     │ Backend     │
        │ (Uvicorn) │     │ (Uvicorn) │     │ (Uvicorn)   │
        └─────┬─────┘     └─────┬─────┘     └──────┬──────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Redis (pub/sub)       │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   PostgreSQL Primary     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   PostgreSQL Read Rep   │
                    └─────────────────────────┘
```
