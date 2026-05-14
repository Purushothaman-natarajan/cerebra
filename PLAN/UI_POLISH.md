# UI Polish Plan

Based on comprehensive frontend audit. 40+ issues across all pages.

## Phase 1 — Critical + High (fast wins)

- [ ] ErrorBoundary at app root (`main.tsx`)
- [ ] Error states on all pages (when API fails)
- [ ] Replace all emoji with lucide-react SVGs
- [ ] Fix double-padding on AgentsPage + ChannelsPage
- [ ] Loading skeletons on WorkflowsPage + ChannelsPage
- [ ] Dialog: ARIA, focus trap, close button, body scroll lock, animations

## Phase 2 — Medium (theme + consistency)

- [ ] Theme-aware colors in AgentNode, RouterNode, EdgeMenu, LiveLogs, MessageTrace
- [ ] Consistent `<Empty>` component usage everywhere
- [ ] LiveLogs redesign (modern log viewer, not terminal black)
- [ ] Dialog open/close animations + body scroll lock
- [ ] Danger button uses error CSS var

## Phase 3 — Low (polish)

- [ ] Normalize sidebar widths (w-60 for nav/workflows/runs)
- [ ] Add `@tailwindcss/forms` plugin
- [ ] Normalize all imports to `@/` path alias
- [ ] Add semantic color tokens (--success, --warning, --error, --info)
