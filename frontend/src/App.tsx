import { Routes, Route, Navigate, NavLink } from "react-router-dom"
import { Bot, GitBranch, Activity, Radio } from "lucide-react"
import { ThemeProvider } from "./contexts/ThemeContext"
import AgentsPage from "./pages/AgentsPage"
import WorkflowsPage from "./pages/WorkflowsPage"
import RunsPage from "./pages/RunsPage"
import ChannelsPage from "./pages/ChannelsPage"
import ThemeToggle from "./components/ui/ThemeToggle"
import AccentPicker from "./components/ui/AccentPicker"

const navItems = [
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
  { to: "/runs", label: "Runs", icon: Activity },
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
          <Route path="/" element={<Navigate to="/agents" replace />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
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
