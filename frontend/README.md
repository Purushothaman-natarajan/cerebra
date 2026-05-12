# Cerebra — Frontend

AI Agent Orchestration Platform frontend. React + TypeScript + ReactFlow.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Routing | React Router v7 |
| State | Zustand |
| Data Fetching | TanStack Query |
| UI | Tailwind CSS |
| Workflow Canvas | ReactFlow |
| Charts | Recharts |
| Icons | Lucide React |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (proxies API to localhost:8000)
npm run dev
```

Opens at http://localhost:5173. The Vite dev server proxies `/api/*` to `http://localhost:8000/*` and `ws://localhost:8000/ws/*` for WebSocket connections.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/agents` | AgentsPage | List, create, edit AI agents |
| `/workflows` | WorkflowsPage | Visual workflow canvas with ReactFlow |
| `/runs` | RunsPage | Run history with event traces |
| `/channels` | ChannelsPage | Telegram and channel configuration |

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AgentBuilder/
│   │   │   ├── AgentForm.tsx      # Create/edit agent form
│   │   │   └── AgentCard.tsx      # Agent summary card
│   │   ├── WorkflowCanvas/
│   │   │   ├── Canvas.tsx         # ReactFlow wrapper
│   │   │   ├── AgentNode.tsx      # Custom agent node renderer
│   │   │   ├── RouterNode.tsx     # Router decision node
│   │   │   └── EdgeMenu.tsx       # Edge condition editor
│   │   ├── MonitorPanel/
│   │   │   ├── LiveLogs.tsx       # WebSocket log stream
│   │   │   ├── TokenChart.tsx     # Token/cost monitoring (Recharts)
│   │   │   └── MessageTrace.tsx   # Inter-agent message trace
│   │   └── ChannelConfig/
│   │       └── TelegramSetup.tsx  # Telegram bot configuration
│   ├── pages/
│   │   ├── AgentsPage.tsx
│   │   ├── WorkflowsPage.tsx
│   │   ├── RunsPage.tsx
│   │   └── ChannelsPage.tsx
│   ├── store/
│   │   ├── agentStore.ts          # Zustand store for agents
│   │   └── runStore.ts            # Zustand store for runs
│   ├── api/
│   │   └── ...                    # TanStack Query hooks
│   ├── App.tsx                    # Root component with routes
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Tailwind base styles
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── Dockerfile
```

## API Integration

The frontend communicates with the FastAPI backend through:

- **REST API** — CRUD operations for agents, workflows, runs, and channels
- **WebSocket** — Real-time run event streaming at `ws://host:8000/ws/runs/{run_id}`

Vite dev server proxies:
- `/api/*` → `http://localhost:8000/*`
- `/ws/*` → `ws://localhost:8000/*`

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # TypeScript check + production build
npm run preview   # Preview production build
```

## Component Architecture

### WorkflowCanvas (ReactFlow)

The canvas renders a directed graph where:
- **Agent nodes** represent LLM agents with configurable tools and prompts
- **Router nodes** represent conditional branching logic
- **Edges** can have conditions attached for routing decisions

Users drag-and-drop nodes, connect them with edges, and configure conditions inline.

### MonitorPanel

Connects to the WebSocket endpoint for a given run ID and renders:
- **LiveLogs** — Real-time scrolling log of agent actions, tool calls, and LLM responses
- **TokenChart** — Recharts line chart tracking token usage over time
- **MessageTrace** — Tree view showing the path of messages between agents

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. The Dockerfile serves it via nginx:

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
```
