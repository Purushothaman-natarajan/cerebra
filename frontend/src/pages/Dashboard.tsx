/** Dashboard — stats + onboarding + quick actions + recent runs. Responsive grid. */

import { useNavigate } from "react-router-dom"
import { Zap, Wrench, Bot, GitBranch, Activity, ArrowRight } from "lucide-react"
import { useProviders } from "@/api/providers"
import { useTools } from "@/api/tools"
import { useAgents } from "@/api/agents"
import { useWorkflows } from "@/api/workflows"
import { useRuns } from "@/api/runs"
import { Card, Badge, Skeleton } from "@/components/ui"

export default function Dashboard() {
  const { data: providers } = useProviders()
  const { data: tools } = useTools()
  const { data: agents } = useAgents()
  const { data: workflows } = useWorkflows()
  const { data: runs } = useRuns()
  const navigate = useNavigate()

  const recentRuns = runs?.slice(0, 5) ?? []
  const hasData = (providers?.length ?? 0) > 0 || (agents?.length ?? 0) > 0

  const stats = [
    { icon: Zap, label: "Providers", count: providers?.length, color: "var(--accent)", link: "/providers" },
    { icon: Wrench, label: "Tools", count: tools?.length, color: "var(--accent)", link: "/tools" },
    { icon: Bot, label: "Agents", count: agents?.length, color: "var(--accent)", link: "/agents" },
    { icon: GitBranch, label: "Workflows", count: workflows?.length, color: "var(--accent)", link: "/workflows" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Onboarding */}
      {!hasData && (
        <div className="p-6 rounded-2xl border border-accent/30 bg-accent-soft/30 backdrop-blur-sm animate-in">
          <h2 className="text-lg font-semibold text-foreground mb-1">Welcome to Orchid 🌸</h2>
          <p className="text-sm text-muted mb-5">Build your first multi-agent workflow in 5 steps:</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { step: 1, label: "Add a provider", icon: "⚡", link: "/providers" },
              { step: 2, label: "Configure tools", icon: "🔧", link: "/tools" },
              { step: 3, label: "Create agents", icon: "🤖", link: "/agents" },
              { step: 4, label: "Build a workflow", icon: "🔀", link: "/workflows" },
              { step: 5, label: "Add a channel", icon: "📡", link: "/channels" },
            ].map((s) => (
              <button key={s.step} onClick={() => navigate(s.link)}
                className="p-3 rounded-xl border border-border bg-card hover:border-accent/50 hover:shadow-soft transition-all duration-200 text-left group"
              >
                <span className="text-lg">{s.icon}</span>
                <p className="text-sm font-medium text-foreground mt-1 group-hover:text-accent transition-colors">{s.label}</p>
                <p className="text-[10px] text-muted">Step {s.step}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} hover className="flex items-center gap-3 sm:gap-4 cursor-pointer p-4" onClick={() => navigate(s.link)}>
            <div className="p-2.5 sm:p-3 rounded-xl bg-accent-soft shrink-0" style={{ color: s.color }}>
              <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{s.count ?? <Skeleton className="h-7 w-10 inline-block align-middle" />}</p>
              <p className="text-xs text-muted truncate">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick actions + Recent runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <h2 className="font-semibold text-foreground mb-4 text-sm">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { icon: Zap, label: "Add Provider", link: "/providers" },
              { icon: Wrench, label: "New Tool", link: "/tools" },
              { icon: Bot, label: "New Agent", link: "/agents" },
              { icon: GitBranch, label: "New Workflow", link: "/workflows" },
            ].map((a) => (
              <button key={a.label} onClick={() => navigate(a.link)}
                className="flex items-center gap-2 sm:gap-3 p-3 rounded-xl border border-border hover:border-accent/50 hover:bg-accent-soft transition-all duration-200 text-left group"
              >
                <div className="p-2 rounded-lg bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
                  <a.icon className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-accent transition-colors">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-foreground mb-4 text-sm">Recent Runs</h2>
          {recentRuns.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted">No runs yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent-soft transition-colors cursor-pointer" onClick={() => navigate("/runs")}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-muted shrink-0">#{run.id.slice(0, 6)}</span>
                    <Badge variant={run.status === "completed" ? "success" : run.status === "running" ? "info" : run.status === "failed" ? "danger" : "default"} className="shrink-0">
                      {run.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted shrink-0">{run.started_at ? new Date(run.started_at).toLocaleDateString() : ""}</span>
                </div>
              ))}
            </div>
          )}
          {recentRuns.length > 0 && (
            <button onClick={() => navigate("/runs")} className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-muted hover:text-accent transition-colors py-2 rounded-lg hover:bg-accent-soft">
              View all runs <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </Card>
      </div>
    </div>
  )
}
