# Cerebra‑AI — Tech Stack

## Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Python / FastAPI | 0.115 | Async REST + WebSocket, auto OpenAPI docs |
| **AI Runtime** | LangGraph | 0.2.60 | StateGraph for visual workflow execution |
| **LLM SDK** | google-genai | 1.10 | Gemini API client |
| **Database** | PostgreSQL (asyncpg) | 16 / 0.30 | Primary database |
| **Dev Database** | SQLite (aiosqlite) | — | Unit testing, local dev without Postgres |
| **Cache/Messaging** | Redis (redis-py async) | 5.2 / 7-alpine | Pub/sub event streaming |
| **ORM** | SQLAlchemy 2.0 (asyncio) | 2.0.36 | Async ORM with JSON columns |
| **Migration** | Alembic | 1.14 | Schema versioning |
| **Validation** | Pydantic v2 | 2.10 | Request/response schemas with Field examples |
| **Config** | pydantic-settings | 2.7 | .env-based configuration |
| **Encryption** | cryptography (Fernet) | 44.0 | Provider API key encryption at rest |
| **HTTP Client** | httpx | 0.28 | Async HTTP for tool calls + provider testing |
| **HTML Parsing** | BeautifulSoup4 + lxml | 4.12 / 5.3 | web_search tool result parsing |
| **Testing** | pytest / pytest-asyncio | 8.3 / 0.24 | Test framework |
| **Server** | Uvicorn | 0.34 | ASGI server |

### Why LangGraph over alternatives

| Feature | LangGraph | CrewAI | AutoGen |
|---------|-----------|--------|---------|
| Graph execution | ✅ Native StateGraph | ❌ Linear pipeline | ✅ DAG-based |
| Conditional branching | ✅ Built-in | ❌ Manual | ⚠️ Limited |
| Checkpointing | ✅ Native | ❌ | ✅ |
| Human-in-the-loop | ✅ interrupt_before/after | ❌ | ⚠️ |
| Each node = testable function | ✅ | ❌ | ❌ |
| Production maturity | ✅ Used by LangChain | ⚠️ | ⚠️ |

### Why FastAPI

- **Async-native**: Concurrent LLM calls without blocking
- **Auto OpenAPI**: Swagger UI at `/docs` with zero config
- **Pydantic integration**: Request/response validation with examples
- **WebSocket support**: Native WebSocket for real-time log streaming
- **Middleware system**: Auth, CORS, rate limiting as middleware stack

## Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 19 | Latest concurrent features |
| **Language** | TypeScript | 5.7 | Strict mode, `@/` path aliases |
| **Build** | Vite | 6.4 | Fast HMR, ESM, CSS support |
| **Routing** | React Router | 7.1 | Client-side routing, NavLink |
| **State** | Zustand | 5.0 | Minimal agent form state |
| **Data Fetching** | TanStack Query | 5.62 | Cache, auto-refetch, mutations |
| **Canvas** | ReactFlow | 11.11 | Drag-and-drop node graph |
| **Styling** | Tailwind CSS | 3.4 | Utility-first, CSS variable theming |
| **Charts** | Recharts | 2.15 | Token/cost line charts |
| **Icons** | Lucide React | 0.468 | Tree-shakeable SVG icons |
| **Testing** | Vitest + Testing Library | 4.1 | Component tests, jsdom |
| **HTTP** | Fetch API (via apiFetch) | — | Auth headers, error parsing |

### Theming System

- **CSS Variables**: 42 custom properties in `theme.css`
- **Dark Mode**: Google AI Studio–inspired (`#111318` background, `#1e2028` cards, `#8ab4f8` accent)
- **Accent Colors**: 6 presets (blue, purple, emerald, amber, rose, cyan) with dedicated dark variants
- **Modes**: Light, Dark, System (follows OS preference)
- **Persistence**: User choice saved to `localStorage`

### Design System (14 components in `src/components/ui/`)

| Component | Variants | States | Accessibility |
|-----------|----------|--------|---------------|
| **Button** | primary, secondary, ghost, danger, outline | loading, disabled, hover, active:scale | focus ring |
| **Input** | — | error, disabled, focus | label, aria-describedby |
| **Select** | with optgroups | error, disabled | label |
| **Textarea** | — | error, disabled | label |
| **Card** | glass, hover | shadow lift | — |
| **Badge** | default, success, warning, danger, info | — | semantic color tokens |
| **Dialog** | — | open/close animation | role=dialog, aria-modal, focus trap, esc to close |
| **Toast** | success, error, info, warning | auto-dismiss 4s | stackable, slide-in |
| **Skeleton** | card, row | pulse animation | — |
| **Empty** | — | with/without action | icon + title + description |
| **AccentPicker** | 6 color dots | selected ring | aria-label |
| **ThemeToggle** | — | sun/moon icon | aria-label |
| **StepIndicator** | — | active/done/pending | — |
| **cn()** | utility | — | clsx + tailwind-merge |

## Infrastructure

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Container** | Docker Compose | Single command: `docker compose up` |
| **Frontend Server** | nginx (alpine) | SPA fallback, API proxy, security headers, gzip |
| **Backend Server** | Uvicorn | No `--reload` in production |
| **Database** | PostgreSQL 16-alpine | Healthcheck, named volume |
| **Cache** | Redis 7-alpine | Optional password auth |
| **Package** | uv + pip | `uv sync` for speed, `pip` fallback |

## Development Tools

| Tool | Purpose |
|------|---------|
| **uv** | Fast Python package manager |
| **npm** | Node.js dependency management |
| **Make** | `make dev`, `make build`, `make clean` |
| **Alembic** | Database migrations |
| **pytest** | Backend test runner |
| **vitest** | Frontend test runner |
| **TypeScript** | Type checking (strict mode) |

## Current API Surface (25+ endpoints)

All endpoints have typed request schemas with examples, `response_model=`, and error response documentation in Swagger.

| Group | Endpoints | Auth |
|-------|-----------|------|
| `/agents` | GET, POST, GET/{id}, PATCH/{id}, DELETE/{id} | Bearer |
| `/workflows` | GET, POST, GET/{id}, PATCH/{id}, DELETE/{id} | Bearer |
| `/runs` | GET, POST, GET/{id}, GET/{id}/events | Bearer |
| `/templates` | GET | Bearer |
| `/providers` | GET, POST, PATCH/{id}, DELETE/{id}, POST/test, GET/models, GET/presets | Bearer |
| `/tools` | GET, POST, POST/test, DELETE/{id} | Bearer |
| `/channels` | GET, POST, POST/webhook/telegram | Bearer (webhook: none) |
| `/ws/runs/{id}` | WebSocket | Token param |
| `/health` | GET | None |
| `/docs`, `/redoc` | GET | None |
