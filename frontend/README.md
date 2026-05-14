# Cerebra‑AI — Frontend

AI Agent Orchestration Platform frontend. React 19 + TypeScript + ReactFlow + Tailwind.

## Tech Stack & Reasoning

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | React 19 | Latest concurrent features, `@/` path aliases |
| **Build** | Vite 6 | Fast HMR, native ESM, TypeScript strict mode |
| **Routing** | React Router v7 | Client-side routing with NavLink for sidebar |
| **State** | Zustand | Minimal boilerplate for agent form state |
| **Data Fetching** | TanStack Query v5 | Auto cache invalidation, mutation lifecycle, retry=1 |
| **Canvas** | ReactFlow v11 | Drag-and-drop node graph with 5 custom node types |
| **UI** | Tailwind CSS v3 + CSS vars | Full theming: 6 accent colors, dark/light/system modes |
| **Charts** | Recharts | Token/cost monitoring in run detail view |
| **Icons** | Lucide | Clean SVG icons, tree-shakeable |
| **Testing** | Vitest + Testing Library | 23 component tests |

## Theming

- **6 accent colors**: blue, purple, emerald, amber, rose, cyan — switchable via sidebar
- **Dark/light/system mode**: Manual toggle (persisted to localStorage) or OS preference
- **CSS variable system**: `--bg-primary`, `--fg-primary`, `--accent`, `--success`, `--error`, `--border`, etc.
- **Glassmorphism**: `.glass` class with `backdrop-filter: blur()` and semi-transparent backgrounds

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Stats cards, onboarding wizard, recent runs/workflows |
| `/providers` | ProvidersPage | Add/manage LLM providers with test connection |
| `/templates` | TemplatesPage | Browse pre-built workflows with import history |
| `/tools` | ToolsPage | Create/test custom HTTP/Python/Webhook tools |
| `/agents` | AgentsPage | CRUD agents with provider+model selector |
| `/workflows` | WorkflowsPage | ReactFlow canvas with 5 node types + template wizard |
| `/runs` | RunsPage | Run history + detail view with timeline/log/events |
| `/channels` | ChannelsPage | 3-step Telegram bot setup wizard |
| `/settings` | SettingsPage | Theme, notifications, execution defaults, security info |

## Component Architecture

```
src/
├── api/              # TanStack Query hooks + auth fetch client
│   ├── client.ts     # apiFetch with error parsing + auth headers
│   ├── auth.ts       # API key storage
│   ├── agents.ts     # Agent CRUD hooks
│   ├── workflows.ts  # Workflow CRUD hooks
│   ├── runs.ts       # Run hooks
│   ├── providers.ts  # Provider + model hooks
│   ├── tools.ts      # Tool CRUD hooks
│   └── templates.ts  # Template hooks
├── components/
│   ├── ui/           # Design system (14 components)
│   │   ├── Button, Input, Select, Textarea  # Form controls with variants
│   │   ├── Card, Badge, Dialog              # Layout + overlay
│   │   ├── Toast, Skeleton, Empty           # Feedback + loading
│   │   ├── ThemeToggle, AccentPicker        # Theme controls
│   │   └── StepIndicator                    # Wizard step progress
│   ├── AgentBuilder/  # AgentForm + AgentCard
│   ├── WorkflowCanvas/ # Canvas, AgentNode, RouterNode, HumanNode, OutputNode, NoteNode, EdgeMenu, NodeConfigPanel
│   ├── MonitorPanel/   # LiveLogs (WebSocket), MessageTrace
│   └── ToolBuilder/    # ToolForm, ToolTestDialog
├── pages/             # 9 page components
├── contexts/          # ThemeContext (light/dark/system + accent)
├── store/             # agentStore (Zustand)
├── test/              # 7 test files (23 tests)
└── styles/            # theme.css (CSS variable definitions)
```

## Component Kit

All components in `src/components/ui/` use `cn()` utility (clsx + tailwind-merge):

| Component | Variants | Features |
|-----------|----------|----------|
| **Button** | primary, secondary, ghost, danger, outline | 3 sizes, loading spinner, scale-on-click |
| **Input** | — | Label, error state, helper text, focus ring, show/hide password |
| **Select** | — | Option groups, placeholder, label, error |
| **Textarea** | — | Auto-resize, label, error state |
| **Card** | — | Glass variant, hover lift effect, border-theme aware |
| **Badge** | default, success, warning, danger, info | Semantic color tokens |
| **Dialog** | — | ARIA modal, focus trap, escape/backdrop close, animations |
| **Toast** | success, error, info, warning | Stackable, auto-dismiss (4s), slide-in animation |
| **Skeleton** | Card, Row variants | Pulse animation |
| **Empty** | — | Icon + title + description + CTA button |

## Security

- **Auth headers**: All API calls via `apiFetch()` auto-attach `Authorization: Bearer` from localStorage
- **WebSocket auth**: WS URL includes `?token=` query param when API key is set
- **Toast errors**: All mutation errors show as toast notifications
- **Error boundaries**: App-level error boundary with Retry button
- **Input validation**: All forms validate before submission

## Testing

```bash
npm test              # Run 23 component tests
npm run test:watch    # Watch mode
npm run build         # TypeScript check + production build
```

## Build

```bash
npm run dev           # Dev server with HMR on port 5173
npm run build         # Production build + TypeScript check
npm run preview       # Preview production build
```
