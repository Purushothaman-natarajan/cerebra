/** Root layout: sidebar navigation + themed content area with error boundaries. */

import { Component, type ReactNode, useState } from "react"
import { Routes, Route, NavLink } from "react-router-dom"
import { Zap, Wrench, Bot, GitBranch, Radio, Activity, Settings, Menu, X } from "lucide-react"
import { ThemeProvider } from "./contexts/ThemeContext"
import AgentsPage from "./pages/AgentsPage"
import WorkflowsPage from "./pages/WorkflowsPage"
import RunsPage from "./pages/RunsPage"
import ChannelsPage from "./pages/ChannelsPage"
import ProvidersPage from "./pages/ProvidersPage"
import ToolsPage from "./pages/ToolsPage"
import SettingsPage from "./pages/SettingsPage"
import Dashboard from "./pages/Dashboard"
import ThemeToggle from "./components/ui/ThemeToggle"
import AccentPicker from "./components/ui/AccentPicker"
import { Button } from "./components/ui"

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <p className="text-rose-500 mb-2">Something went wrong</p>
            <p className="text-sm text-muted mb-4">{this.state.error.message}</p>
            <Button onClick={() => this.setState({ error: null })}>Retry</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function Page({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

const navItems = [
  { to: "/providers", label: "Providers", icon: Zap },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
  { to: "/channels", label: "Channels", icon: Radio },
  { to: "/runs", label: "Runs", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
]

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onToggle} />
      )}
      <nav className={`${collapsed ? "-translate-x-full" : "translate-x-0"} fixed lg:static z-50 w-56 border-r border-border bg-card shrink-0 flex flex-col transition-transform duration-200`}>
        <div className="flex items-center justify-between p-4">
          <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>🌸 Orchid</span>
          <button onClick={onToggle} className="lg:hidden p-1 rounded hover:bg-accent-soft">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive ? "font-medium" : "text-muted hover:text-foreground hover:bg-accent-soft"
                }`
              }
              style={({ isActive }) => (isActive ? { background: "var(--accent-soft)", color: "var(--accent)" } : {})}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="p-3 border-t border-border flex items-center justify-between">
          <AccentPicker />
          <ThemeToggle />
        </div>
      </nav>
    </>
  )
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 overflow-auto min-w-0" style={{ background: "var(--bg-secondary)" }}>
        <div className="lg:hidden flex items-center gap-2 p-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="p-1 rounded hover:bg-accent-soft">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>🌸 Orchid</span>
        </div>
        <Routes>
          <Route path="/" element={<Page><Dashboard /></Page>} />
          <Route path="/providers" element={<Page><ProvidersPage /></Page>} />
          <Route path="/tools" element={<Page><ToolsPage /></Page>} />
          <Route path="/agents" element={<Page><AgentsPage /></Page>} />
          <Route path="/workflows" element={<Page><WorkflowsPage /></Page>} />
          <Route path="/channels" element={<Page><ChannelsPage /></Page>} />
          <Route path="/runs" element={<Page><RunsPage /></Page>} />
          <Route path="/settings" element={<Page><SettingsPage /></Page>} />
        </Routes>
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
