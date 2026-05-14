/** Dashboard — stats, onboarding, quick actions, recent runs, creation history. */

import { useNavigate } from "react-router-dom"
import { Zap, Wrench, Bot, GitBranch, Activity, ArrowRight, Clock, FileText } from "lucide-react"
import { useProviders } from "@/api/providers"
import { useAgents } from "@/api/agents"
import { useWorkflows } from "@/api/workflows"
import { useRuns } from "@/api/runs"
import { Card, Badge, Skeleton } from "@/components/ui"

export default function Dashboard() {
  const { data: providers } = useProviders()
  const { data: agents } = useAgents()
  const { data: workflows } = useWorkflows()
  const { data: runs } = useRuns()
  const navigate = useNavigate()

  const recentRuns = runs?.slice(0, 4) ?? []
  const recentWorkflows = workflows?.slice(0, 3) ?? []
  const recentAgents = agents?.slice(0, 3) ?? []
  const hasData = (providers?.length ?? 0) > 0 || (agents?.length ?? 0) > 0

  const stats = [
    { icon: Zap, label: "Providers", count: providers?.length, link: "/providers" },
    { icon: Bot, label: "Agents", count: agents?.length, link: "/agents" },
    { icon: GitBranch, label: "Workflows", count: workflows?.length, link: "/workflows" },
    { icon: Activity, label: "Runs", count: runs?.length, link: "/runs" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Onboarding */}
      {!hasData && (
        <div className="p-6 rounded-2xl border border-accent/30 bg-accent-soft/30 backdrop-blur-sm animate-in">
          <h2 className="text-lg font-semibold text-foreground mb-1">Welcome to Cerebra</h2>
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
                className="p-3 rounded-xl border border-border bg-card hover:border-accent/50 hover:shadow-soft transition-all text-left group"
              >
                <span className="text-lg">{s.icon}</span>
                <p className="text-sm font-medium text-foreground mt-1 group-hover:text-accent">{s.label}</p>
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
            <div className="p-2.5 sm:p-3 rounded-xl bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
              <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground truncate">{s.count ?? <Skeleton className="h-7 w-10 inline-block align-middle" />}</p>
              <p className="text-xs text-muted truncate">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <Card>
          <h2 className="font-semibold text-foreground mb-4 text-sm flex items-center gap-2"><Zap className="w-4 h-4" /> Quick Actions</h2>
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: Zap, label: "Add Provider", link: "/providers" },
              { icon: Wrench, label: "New Tool", link: "/tools" },
              { icon: Bot, label: "New Agent", link: "/agents" },
              { icon: GitBranch, label: "New Workflow", link: "/workflows" },
              { icon: FileText, label: "Use Template", link: "/workflows" },
            ].map((a) => (
              <button key={a.label} onClick={() => navigate(a.link)}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-accent/50 hover:bg-accent-soft transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
                  <a.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-accent">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Recent Workflows & Agents */}
        <Card>
          <h2 className="font-semibold text-foreground mb-4 text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Recent</h2>
          {recentWorkflows.length === 0 && recentAgents.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted">Nothing created yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentWorkflows.map((wf) => (
                <div key={wf.id} onClick={() => navigate("/workflows")} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-accent-soft transition-colors cursor-pointer">
                  <GitBranch className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{wf.name}</span>
                  <Badge variant="info" className="shrink-0">workflow</Badge>
                </div>
              ))}
              {recentAgents.map((agent) => (
                <div key={agent.id} onClick={() => navigate("/agents")} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-accent-soft transition-colors cursor-pointer">
                  <Bot className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{agent.name}</span>
                  <Badge variant="default" className="shrink-0">agent</Badge>
                </div>
              ))}
            </div>
          )}
          {(recentWorkflows.length > 0 || recentAgents.length > 0) && (
            <button onClick={() => navigate("/workflows")} className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-muted hover:text-accent transition-colors py-2 rounded-lg hover:bg-accent-soft">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </Card>

        {/* Recent Runs */}
        <Card>
          <h2 className="font-semibold text-foreground mb-4 text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Runs</h2>
          {recentRuns.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted">No runs yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentRuns.map((run) => (
                <div key={run.id} onClick={() => navigate("/runs")} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent-soft transition-colors cursor-pointer">
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
