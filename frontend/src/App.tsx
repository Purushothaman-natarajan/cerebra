import { Component, type ReactNode } from "react"
import { Routes, Route, NavLink } from "react-router-dom"
import { Bot, GitBranch, Activity, Radio, Cpu, Wrench, LayoutDashboard } from "lucide-react"
import { ThemeProvider } from "./contexts/ThemeContext"
import AgentsPage from "./pages/AgentsPage"
import WorkflowsPage from "./pages/WorkflowsPage"
import RunsPage from "./pages/RunsPage"
import ChannelsPage from "./pages/ChannelsPage"
import ProvidersPage from "./pages/ProvidersPage"
import ToolsPage from "./pages/ToolsPage"
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
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
  { to: "/runs", label: "Runs", icon: Activity },
  { to: "/providers", label: "Providers", icon: Cpu },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/channels", label: "Channels", icon: Radio },
]

function Sidebar() {
  return (
    <nav className="w-56 border-r border-border bg-card shrink-0 flex flex-col">
      <div className="p-4 text-lg font-bold" style={{ color: "var(--accent)" }}>
        Cerebra
      </div>
      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? "font-medium"
                  : "text-muted hover:text-foreground hover:bg-accent-soft"
              }`
            }
            style={({ isActive }) =>
              isActive ? { background: "var(--accent-soft)", color: "var(--accent)" } : {}
            }
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
  )
}

function AppContent() {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ background: "var(--bg-secondary)" }}>
        <Routes>
          <Route path="/" element={<Page><Dashboard /></Page>} />
          <Route path="/agents" element={<Page><AgentsPage /></Page>} />
          <Route path="/workflows" element={<Page><WorkflowsPage /></Page>} />
          <Route path="/runs" element={<Page><RunsPage /></Page>} />
          <Route path="/providers" element={<Page><ProvidersPage /></Page>} />
          <Route path="/tools" element={<Page><ToolsPage /></Page>} />
          <Route path="/channels" element={<Page><ChannelsPage /></Page>} />
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
