# Orchid UX — Implementation Plan

Based on UX_PLAN.md. Implemented in phases, one screen at a time.

## Phase 1 — App Shell & Navigation

- [ ] Rename app from "Cerebra" to "Orchid" (title, sidebar, READMEs)
- [ ] Reorder sidebar: Providers → Tools → Agents → Workflows → Channels → Runs → Settings
- [ ] Update nav icons to match UX plan (⚡🔧🤖🔀📡▶️)
- [ ] Add Settings page (placeholder)
- [ ] Update onboarding banner for first-time users
- [ ] Responsive sidebar (collapse on smaller screens)

## Phase 2 — Screens 1-3: Providers, Tools, Agents

- [ ] **Screen 1 — Providers**: Redesign cards with model list, masked key, verified badge
- [ ] **Screen 1 — Add Provider**: Slide-in drawer with preset buttons, test connection flow
- [ ] **Screen 2 — Tools**: Grid layout for built-in tools, "Create Custom Tool" card
- [ ] **Screen 2 — Custom Tool Form**: 3 paths (HTTP/Python/OpenAPI spec)
- [ ] **Screen 3 — Agents**: Card redesign with avatar emoji, model badge, memory indicator
- [ ] **Screen 3 — Agent Form**: 4-tab form (Identity, Model & Tools, Memory, Guardrails)

## Phase 3 — Screen 4: Workflows (Canvas improvements)

- [ ] **Template picker**: Modal with cards, preview on click, 3-step wizard
- [ ] **Workflow list**: Cards with status, last run, action buttons (Open, Run Now, Duplicate, Delete)
- [ ] **Canvas improvements**: Right-click context menu, inline condition editor, node labels
- [ ] **Run Configuration modal**: Input override, model override, step-by-step mode

## Phase 4 — Screens 5-6: Channels, Runs

- [ ] **Screen 5 — Channels**: 3-step Telegram wizard, linked workflows display
- [ ] **Screen 6 — Runs list**: Filterable, status badges, cost, duration
- [ ] **Run Detail**: Timeline + Live Log + Messages + Token/Cost tracker

## Phase 5 — Polish

- [ ] **Empty states**: Custom per-page with icon + explanation + CTA
- [ ] **Onboarding**: 5-step welcome banner, first-time detection
- [ ] **Settings page**: General, Execution, Notifications, Danger zone
- [ ] **Micro-interactions**: Save pulses, ghost drag, fade-up logs, toast notifications
- [ ] **Responsive**: Mobile-friendly runs/agents/providers, canvas view-only on mobile
