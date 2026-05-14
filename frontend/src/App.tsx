/** Root layout: responsive sidebar + themed content with page transitions. */

import { useState } from "react"
import { Routes, Route, NavLink, useLocation } from "react-router-dom"
import { Zap, Wrench, Bot, GitBranch, Radio, Activity, Settings, Menu, X } from "lucide-react"
import { ThemeProvider } from "@/contexts/ThemeContext"
import AgentsPage from "@/pages/AgentsPage"
import WorkflowsPage from "@/pages/WorkflowsPage"
import RunsPage from "@/pages/RunsPage"
import ChannelsPage from "@/pages/ChannelsPage"
import ProvidersPage from "@/pages/ProvidersPage"
import ToolsPage from "@/pages/ToolsPage"
import SettingsPage from "@/pages/SettingsPage"
import Dashboard from "@/pages/Dashboard"
import ThemeToggle from "@/components/ui/ThemeToggle"
import AccentPicker from "@/components/ui/AccentPicker"

function Page({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return <div key={location.pathname} className="animate-in">{children}</div>
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
  const location = useLocation()
  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
      )}
      <aside className={`${collapsed ? "-translate-x-full" : "translate-x-0"} fixed lg:static z-50 w-60 h-full border-r border-border bg-card shrink-0 flex flex-col transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-5 pb-3">
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--accent)" }}>🌸 Orchid</span>
          <button onClick={onToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-accent-soft transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to))
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => { if (window.innerWidth < 1024) onToggle() }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive ? "font-medium shadow-sm" : "text-muted hover:text-foreground hover:bg-accent-soft"
                }`}
                style={isActive ? { background: "var(--accent-soft)", color: "var(--accent)" } : {}}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border flex items-center justify-between mt-auto">
          <AccentPicker />
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 overflow-auto min-w-0" style={{ background: "var(--bg-secondary)" }}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-accent-soft transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--accent)" }}>🌸 Orchid</span>
        </div>
        <div className="p-4 sm:p-6">
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
        </div>
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
