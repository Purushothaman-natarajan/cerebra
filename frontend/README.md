# Cerebra — Frontend

AI Agent Orchestration Platform frontend.

## Tech Stack & Reasoning

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | React 19 | Latest concurrent features, server components compatible |
| **Build** | Vite 6 | Fast HMR, native TypeScript/ESM, optimal code splitting |
| **Routing** | React Router v7 | Client-side routing with `NavLink` for active-state sidebar |
| **State** | Zustand | Minimal boilerplate, no providers needed, works outside React tree |
| **Data Fetching** | TanStack Query v5 | Automatic cache invalidation, background refetch, mutation lifecycle |
| **Canvas** | ReactFlow v11 | Drag-and-drop node graph, custom node/edge renderers, minimap |
| **UI** | Tailwind CSS v3 + CSS vars | Utility-first, full theming via CSS custom properties |
| **Charts** | Recharts | Lightweight composable charts for future token/cost monitoring |
| **Icons** | Lucide | Clean SVG icons, tree-shakeable |

## Theming

- **6 accent colors**: blue, purple, emerald, amber, rose, cyan — switchable via sidebar
- **Dark/light mode**: Manual toggle (persisted to localStorage), overrides system preference
- **CSS variable system**: `--bg-primary`, `--fg-primary`, `--accent`, `--border`, etc.
- **Glassmorphism**: `.glass` class with `backdrop-filter: blur()` and semi-transparent backgrounds

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Stats cards, quick actions, recent runs |
| `/agents` | AgentsPage | CRUD list for agents. Ctrl+N to create |
| `/workflows` | WorkflowsPage | Visual ReactFlow canvas. Import from templates |
| `/runs` | RunsPage | Run history + WebSocket live logs + event traces |
| `/providers` | ProvidersPage | Configure LLM providers (OpenAI, Gemini, local Ollama, etc.) |
| `/tools` | ToolsPage | Create custom HTTP/Python/Webhook tools |
| `/channels` | ChannelsPage | Configure Telegram bot integration |

## Component Architecture

```
src/
├── api/              # TanStack Query hooks + fetch client with auth
│   ├── client.ts     # apiFetch helper (auto-attaches auth header)
│   ├── auth.ts       # API key storage in localStorage
│   ├── agents.ts     # useAgents, useCreateAgent, etc.
│   ├── workflows.ts  # useWorkflows, useCreateWorkflow, etc.
│   ├── runs.ts       # useRuns, useTriggerRun, etc.
│   ├── providers.ts  # useProviders, useAvailableModels
│   ├── tools.ts      # useTools, useCreateTool
│   └── templates.ts  # useTemplates
├── components/
│   ├── ui/           # Design system kit (13 components)
│   │   ├── cn.ts     # clsx + tailwind-merge utility
│   │   ├── Button.tsx, Input.tsx, Select.tsx, Textarea.tsx
│   │   ├── Card.tsx, Badge.tsx, Dialog.tsx
│   │   ├── Toast.tsx, Skeleton.tsx, Empty.tsx
│   │   └── ThemeToggle.tsx, AccentPicker.tsx
│   ├── AgentBuilder/ # AgentForm, AgentCard
│   ├── WorkflowCanvas/ # Canvas (ReactFlow), AgentNode, RouterNode, EdgeMenu
│   ├── MonitorPanel/ # LiveLogs (WebSocket), MessageTrace
│   └── ToolBuilder/  # ToolForm
├── pages/            # 7 page components
├── contexts/         # ThemeContext (dark/light + accent)
├── store/            # agentStore (Zustand)
└── styles/           # theme.css (CSS variable definitions)
```

## Component Kit

All UI components in `src/components/ui/` use the `cn()` utility (clsx + tailwind-merge):

- **Button**: 5 variants (primary/secondary/ghost/danger/outline), 3 sizes, loading state
- **Input**: Label, error state, helper text, focus ring
- **Select**: Label, error, option groups (optgroup)
- **Textarea**: Auto-resize, label, error state
- **Card**: Glass variant, hover lift effect, border-theme aware
- **Badge**: 5 color variants (default/success/warning/danger/info)
- **Dialog**: Modal with backdrop blur, escape to close, click outside to close
- **Toast**: Stackable notifications, auto-dismiss (4s), 4 types (success/error/info/warning)
- **Skeleton**: Pulse animation, SkeletonCard + SkeletonRow variants
- **Empty**: Icon + title + description + CTA button

## Security

- **Auth headers**: All API calls via `apiFetch()` auto-attach `Authorization: Bearer` from `localStorage`
- **WebSocket auth**: WebSocket URL includes `?token=` query param when API key is set
- **Toast errors**: All mutation errors surface as toast notifications (no raw `alert()`)
- **Error boundaries**: Every page is wrapped in an error boundary with Retry button

## Build

```bash
npm run dev      # Dev server with HMR
npm run build    # Production build (TypeScript check + Vite)
npm run preview  # Preview production build
```

## Component Usage Note

- `TokenChart.tsx` was removed — token/cost tracking not yet implemented on backend
- `useRunStore` was removed — run selection uses local `useState` in RunsPage
