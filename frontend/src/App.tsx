/** Root layout: responsive sidebar + themed content with back nav and page animations. */

import { useState, type ReactNode } from "react"
import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom"
import { Zap, Wrench, Bot, GitBranch, Radio, Activity, Settings, Menu, X, FileText, ArrowLeft, Shield } from "lucide-react"
import { ThemeProvider } from "@/contexts/ThemeContext"
import AgentsPage from "@/pages/AgentsPage"
import WorkflowsPage from "@/pages/WorkflowsPage"
import RunsPage from "@/pages/RunsPage"
import ChannelsPage from "@/pages/ChannelsPage"
import ProvidersPage from "@/pages/ProvidersPage"
import ToolsPage from "@/pages/ToolsPage"
import TemplatesPage from "@/pages/TemplatesPage"
import SettingsPage from "@/pages/SettingsPage"
import Dashboard from "@/pages/Dashboard"
import ThemeToggle from "@/components/ui/ThemeToggle"
import AccentPicker from "@/components/ui/AccentPicker"

function Page({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <div key={location.pathname} className="animate-in">{children}</div>
}

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
      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors mb-4 group"
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
      <aside className={`${collapsed ? "-translate-x-full" : "translate-x-0"} fixed lg:static z-50 w-60 h-full border-r border-border bg-card shrink-0 flex flex-col transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--accent)" }}>Cerebra</span>
          <button onClick={onToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-accent-soft transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-4 sm:px-6 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to))
            return (
              <NavLink key={item.to} to={item.to}
                onClick={() => { if (window.innerWidth < 1024) onToggle() }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive ? "font-medium shadow-sm" : "text-muted hover:text-foreground hover:bg-accent-soft"
                }`}
                style={isActive ? { background: "var(--accent-soft)", color: "var(--accent)" } : {}}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 sm:p-6 border-t border-border flex items-center justify-between">
          <AccentPicker />
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}

/** Normal pages: padded, scrollable — each page controls its own centering */
function StandardPage({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 sm:p-6 overflow-auto flex-1 flex flex-col">
      <BackButton />
      <div className="w-full flex-1">
        <Page>{children}</Page>
      </div>
    </div>
  )
}

/** Full-bleed pages: no padding, fills the main area */
function FullPage({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-hidden">{children}</div>
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isFullLayout = ["/workflows", "/runs"].some((p) => location.pathname.startsWith(p) && location.pathname !== "/")

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 flex flex-col min-w-0" style={{ background: "var(--bg-secondary)" }}>
        {/* Mobile header — hidden on desktop */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-accent-soft transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--accent)" }}>Cerebra</span>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-muted">
            <Shield className="w-3 h-3" />
            <span>Encrypted</span>
          </div>
        </div>

        {isFullLayout ? (
          <Routes>
            <Route path="/workflows" element={<FullPage><WorkflowsPage /></FullPage>} />
            <Route path="/runs" element={<FullPage><RunsPage /></FullPage>} />
            <Route path="*" element={null} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<StandardPage><Dashboard /></StandardPage>} />
            <Route path="/providers" element={<StandardPage><ProvidersPage /></StandardPage>} />
            <Route path="/templates" element={<StandardPage><TemplatesPage /></StandardPage>} />
            <Route path="/tools" element={<StandardPage><ToolsPage /></StandardPage>} />
            <Route path="/agents" element={<StandardPage><AgentsPage /></StandardPage>} />
            <Route path="/channels" element={<StandardPage><ChannelsPage /></StandardPage>} />
            <Route path="/settings" element={<StandardPage><SettingsPage /></StandardPage>} />
          </Routes>
        )}
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
