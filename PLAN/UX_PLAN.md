# Orchid — UX & Product Experience Plan

> Think: "If LangChain had a UI that didn't feel like a developer tool"

---

## Design Philosophy

- **Progressive disclosure** — simple things are simple; complex things are possible
- **Build once, reuse everywhere** — LLM configs, tools, and agents are assets, not one-offs
- **Visible state at all times** — the user always knows what's running, what failed, why
- **Zero dead ends** — every empty state has a next action; every error has a recovery path

---

## App Shell & Navigation

```
┌─────────────────────────────────────────────────────────┐
│  🌸 orchid          [Providers] [Tools] [Agents]        │
│                     [Workflows] [Channels] [Runs]   ⚙️  │
└─────────────────────────────────────────────────────────┘
```

Left sidebar (collapsed by default on smaller screens):

```
🌸 orchid
─────────────
⚡ Providers       ← Step 1: your LLM keys
🔧 Tools           ← Step 2: what agents can do
🤖 Agents          ← Step 3: who does the work
🔀 Workflows       ← Step 4: how they collaborate
📡 Channels        ← Step 5: how the outside world talks in
▶️  Runs            ← Live + history
─────────────
⚙️  Settings
```

The order in the sidebar **is the onboarding order**. First-time users see a setup banner guiding them left-to-right through all five steps.

---

## Screen 1 — Providers

### Layout
```
Providers                                    [+ Add Provider]

┌──────────────────────────────────────────────────────┐
│  OpenAI                                              │
│  GPT-4o · GPT-4o-mini · GPT-3.5-turbo               │
│  sk-••••••••••••••••3a7f           ✅ Verified  [Edit]│
└──────────────────────────────────────────────────────┘
```

### Add Provider Flow (slide-in drawer)

```
Provider Type    [OpenAI ▾]   [Anthropic ▾]   [Gemini ▾]   [Ollama ▾]   [Custom ▾]

API Key          [••••••••••••••••••••••••••] [Paste]  👁

Base URL         (auto-filled, editable for proxies/Azure)

[Test Connection]  →  ✅ Connected! Models available: gpt-4o, gpt-4o-mini, ...

[Save Provider]
```

---

## Screen 2 — Tools

### Layout
```
Tools                                    [+ Create Tool]

Built-in
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 🔍 Web Search  │ │ 🧮 Calculator  │ │ 🌐 HTTP Request│
│ Tavily API     │ │ Math eval      │ │ Any REST API   │
│ [Configure]    │ │ Ready          │ │ Ready          │
└────────────────┘ └────────────────┘ └────────────────┘
```

### Create Custom Tool — HTTP Tool
```
Name           [Slack Notifier            ]
Description    [Sends a message to Slack  ]
Method         [POST ▾]
URL            [https://hooks.slack.com/services/...]
Test input     [Hello from Orchid         ]
[Send Test] → ✅ 200 OK  {"ok": true}
[Save Tool]
```

---

## Screen 3 — Agents

### Layout
```
Agents                                    [+ New Agent]

┌──────────────────────────────────────────────────────────────┐
│ 🤖 ResearchAgent                                             │
│ "Searches the web and summarizes findings accurately"        │
│ GPT-4o · Tools: Web Search, Calculator  · Memory: ✅         │
│                               [Edit]  [Duplicate]  [Delete]  │
└──────────────────────────────────────────────────────────────┘
```

### Create / Edit Agent — 4 tabs

**Tab 1 — Identity**: Name, Role, Avatar, System Prompt (with AI assist)
**Tab 2 — Model & Tools**: Provider dropdown, Model dropdown, Temperature, Max tokens, Tool checkboxes, Tool use mode
**Tab 3 — Memory**: Enable/disable, Type (buffer/summary/vector), Persist across runs, View memory contents
**Tab 4 — Guardrails**: Max iterations, Max tokens, Response timeout, Blocked topics, Output format, Fallback behavior

---

## Screen 4 — Workflows

### Layout
```
Workflows                        [+ New Workflow]  [📋 Use Template]

┌──────────────────────────────────────────────────────────────┐
│ Research & Report                                            │
│ 3 agents · Linear · Last run: 2h ago ✅                      │
│ [Open Canvas]  [▶ Run Now]  [Duplicate]  [Delete]            │
└──────────────────────────────────────────────────────────────┘
```

### Template Picker (modal with preview + 3-step wizard)
1. Pick template card
2. Assign agents (select existing or create new with pre-filled defaults)
3. Choose models (per-agent, with "change all to cheapest/best")
4. Connect trigger (manual/schedule/Telegram)

### Canvas — drag agents, connect with edges, set conditions inline

---

## Screen 5 — Channels

3-step Telegram wizard:
1. Create bot with @BotFather, paste token
2. Validate webhook endpoint
3. Route incoming messages to a workflow

---

## Screen 6 — Runs

### List view: Filterable, status badges, cost, duration
### Detail view: Timeline (left) + Live Log (right) + Messages panel + Token/Cost tracker

---

## Empty States & Onboarding

- First-time: 5-step welcome banner with progress
- Empty agents: icon + explanation + CTA
- Empty runs: icon + explanation + link to workflows

---

## Settings Screen

General (name, theme), Execution defaults, Notifications, Danger zone (export, reset)

---

## Navigation Flow Summary

```
[Onboarding banner] → [Add Provider] → [Configure Tools] → [Create Agent]
→ [Build Workflow] → [Add Channel] → [Run] → [Runs history]
```

---

## Responsive

- Runs page, Agents, Providers: mobile-friendly
- Canvas: view-only on mobile, "Edit on desktop" prompt
