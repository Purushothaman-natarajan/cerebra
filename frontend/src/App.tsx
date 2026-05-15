/** Root layout: full-screen sidebar + themed content with lazy-loaded routes. */

import { useState, lazy, Suspense, type ReactNode } from "react"
import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom"
import { Zap, Wrench, Bot, GitBranch, Radio, Activity, Settings, Menu, X, FileText, ArrowLeft, Shield } from "lucide-react"
import { ThemeProvider } from "@/contexts/ThemeContext"
import ThemeToggle from "@/components/ui/ThemeToggle"
import AccentPicker from "@/components/ui/AccentPicker"
import { HelpButton } from "@/components/ui"
import ErrorBoundary from "@/components/ui/ErrorBoundary"

// Lazy-loaded pages — ReactFlow and Recharts chunks are loaded on demand
const Dashboard = lazy(() => import("@/pages/Dashboard"))
const AgentsPage = lazy(() => import("@/pages/AgentsPage"))
const ChannelsPage = lazy(() => import("@/pages/ChannelsPage"))
const ProvidersPage = lazy(() => import("@/pages/ProvidersPage"))
const ToolsPage = lazy(() => import("@/pages/ToolsPage"))
const TemplatesPage = lazy(() => import("@/pages/TemplatesPage"))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))
const WorkflowsPage = lazy(() => import("@/pages/WorkflowsPage"))
const RunsPage = lazy(() => import("@/pages/RunsPage"))

const navItems = [
  { to: "/providers", label: "Providers", icon: Zap },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
  { to: "/channels", label: "Channels", icon: Radio },
  { to: "/runs", label: "Runs", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
]

function BackButton() {
  const location = useLocation()
  const navigate = useNavigate()
  if (location.pathname === "/") return null
  return (
    <button onClick={() => navigate(-1)}
      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors group"
    >
      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
      Back
    </button>
  )
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()
  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
      )}
      <aside className={`${collapsed ? "-translate-x-full" : "translate-x-0"} fixed lg:sticky z-50 top-0 w-60 h-screen border-r border-border bg-card shrink-0 flex flex-col transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--accent)" }}>Cerebra‑AI</span>
          <button onClick={onToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-accent-soft transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to))
            return (
              <NavLink key={item.to} to={item.to}
                onClick={() => { if (window.innerWidth < 1024) onToggle() }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive ? "font-medium shadow-sm" : "hover:text-foreground hover:bg-accent-soft"
                }`}
                style={{ color: isActive ? "var(--accent)" : "var(--fg-muted)", background: isActive ? "var(--accent-soft)" : "transparent" }}
              >
                <item.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? "var(--accent)" : "var(--fg-muted)" }} />
                <span className="flex-1">{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 sm:p-6 border-t border-border flex items-center justify-between">
          <AccentPicker /><ThemeToggle />
        </div>
      </aside>
    </>
  )
}

const pageHelp: Record<string, { title: string; steps: string[] }> = {
  "/": { title: "Dashboard", steps: ["View real-time activity across all workflows.", "See recent run stats and token usage.", "Check system health and provider status."] },
  "/providers": { title: "Providers", steps: ["Add an LLM provider (OpenAI, Gemini, Anthropic, etc.).", "Click the provider preset or fill in the form manually.", "Test the connection to fetch available models.", "Toggle active/inactive to show or hide models."] },
  "/templates": { title: "Templates", steps: ["Browse pre-built workflow templates.", "Click a template to preview its structure.", "Use a template as a starting point for your workflow."] },
  "/tools": { title: "Tools", steps: ["Browse built-in tools (web_search, calculator, etc.).", "Create custom tools with HTTP, Python, or webhook types.", "Test a tool with sample input to verify it works.", "Toggle built-in tools to include them in agent configs."] },
  "/agents": { title: "Agents", steps: ["Create an agent with a name, role, and system prompt.", "Select an LLM model from your configured providers.", "Enable tools the agent can use (web_search, calculator, etc.).", "Configure guardrails to block sensitive topics.", "Set max iterations to limit tool-calling loops."] },
  "/channels": { title: "Channels", steps: ["Connect a Telegram bot to enable chat-based workflows.", "Enter the bot token from BotFather on Telegram.", "Bind a workflow to auto-trigger on incoming messages."] },
  "/settings": { title: "Settings", steps: ["Configure your Gemini API key for LLM access.", "Adjust default pricing per provider model.", "View security info — keys are encrypted at rest.", "Export or import settings data.", "Danger Zone: clear all stored API keys."] },
  "/workflows": { title: "Workflows", steps: ["Build a workflow by dragging and connecting nodes on the canvas.", "Each node can be an agent, router, or output.", "Connect nodes with edges to define execution order.", "Add conditions on edges for branching logic.", "Run the workflow with sample input to test it."] },
  "/runs": { title: "Runs", steps: ["View all workflow executions, sorted newest first.", "Select a run to see its timeline and event trace.", "Monitor live logs with WebSocket streaming.", "Check token usage and estimated cost per run.", "Filter runs by status: completed, running, or failed."] },
}

function StandardPage({ children }: { children: ReactNode }) {
  const location = useLocation()
  const help = pageHelp[location.pathname]
  return (
    <div className="p-4 sm:p-6 overflow-auto flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <BackButton />
        {help && <HelpButton title={help.title} steps={help.steps} />}
      </div>
      <div key={location.pathname} className="w-full flex-1 animate-in">{children}</div>
    </div>
  )
}

function FullPage({ children }: { children: ReactNode }) {
  const location = useLocation()
  const help = pageHelp[location.pathname]
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-end px-4 pt-2">
        {help && <HelpButton title={help.title} steps={help.steps} />}
      </div>
      <div className="flex-1 overflow-hidden min-h-0">{children}</div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  )
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const isFullLayout = ["/workflows", "/runs"].some((p) => location.pathname.startsWith(p) && location.pathname !== "/")

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 flex flex-col min-w-0" style={{ background: "var(--bg-secondary)" }}>
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-accent-soft transition-colors"><Menu className="w-5 h-5" /></button>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--accent)" }}>Cerebra‑AI</span>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-muted"><Shield className="w-3 h-3" /><span>Encrypted</span></div>
        </div>
        <Suspense fallback={<Loading />}>
          {isFullLayout ? (
            <Routes>
              <Route path="/workflows" element={<ErrorBoundary componentName="WorkflowsPage"><FullPage><WorkflowsPage /></FullPage></ErrorBoundary>} />
              <Route path="/runs" element={<ErrorBoundary componentName="RunsPage"><FullPage><RunsPage /></FullPage></ErrorBoundary>} />
              <Route path="*" element={null} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<ErrorBoundary componentName="Dashboard"><StandardPage><Dashboard /></StandardPage></ErrorBoundary>} />
              <Route path="/providers" element={<ErrorBoundary componentName="ProvidersPage"><StandardPage><ProvidersPage /></StandardPage></ErrorBoundary>} />
              <Route path="/templates" element={<ErrorBoundary componentName="TemplatesPage"><StandardPage><TemplatesPage /></StandardPage></ErrorBoundary>} />
              <Route path="/tools" element={<ErrorBoundary componentName="ToolsPage"><StandardPage><ToolsPage /></StandardPage></ErrorBoundary>} />
              <Route path="/agents" element={<ErrorBoundary componentName="AgentsPage"><StandardPage><AgentsPage /></StandardPage></ErrorBoundary>} />
              <Route path="/channels" element={<ErrorBoundary componentName="ChannelsPage"><StandardPage><ChannelsPage /></StandardPage></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary componentName="SettingsPage"><StandardPage><SettingsPage /></StandardPage></ErrorBoundary>} />
            </Routes>
          )}
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
