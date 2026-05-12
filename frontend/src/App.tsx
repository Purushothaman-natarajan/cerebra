import { Routes, Route, Navigate, NavLink } from "react-router-dom"
import { Bot, GitBranch, Activity, Radio } from "lucide-react"
import AgentsPage from "./pages/AgentsPage"
import WorkflowsPage from "./pages/WorkflowsPage"
import RunsPage from "./pages/RunsPage"
import ChannelsPage from "./pages/ChannelsPage"

const navItems = [
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
  { to: "/runs", label: "Runs", icon: Activity },
  { to: "/channels", label: "Channels", icon: Radio },
]

function App() {
  return (
    <div className="min-h-screen bg-background flex">
      <nav className="w-56 border-r bg-white dark:bg-slate-900 p-4 shrink-0">
        <div className="text-lg font-bold mb-6 px-2">Cerebra</div>
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
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

export default App
