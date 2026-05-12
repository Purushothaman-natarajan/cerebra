import { useNavigate } from "react-router-dom"
import { Bot, GitBranch, Activity, TrendingUp, FileText } from "lucide-react"
import { useAgents } from "../api/agents"
import { useWorkflows } from "../api/workflows"
import { useRuns } from "../api/runs"
import { Card, Badge, Skeleton, Button } from "../components/ui"

export default function Dashboard() {
  const { data: agents } = useAgents()
  const { data: workflows } = useWorkflows()
  const { data: runs } = useRuns()
  const navigate = useNavigate()

  const recentRuns = runs?.slice(0, 5) ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent-soft" style={{ color: "var(--accent)" }}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{agents?.length ?? <Skeleton className="h-8 w-12 inline-block" />}</p>
            <p className="text-xs text-muted">Agents</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{workflows?.length ?? <Skeleton className="h-8 w-12 inline-block" />}</p>
            <p className="text-xs text-muted">Workflows</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{runs?.length ?? <Skeleton className="h-8 w-12 inline-block" />}</p>
            <p className="text-xs text-muted">Total Runs</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{runs?.filter((r) => r.status === "completed").length ?? 0}</p>
            <p className="text-xs text-muted">Completed</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="justify-start" onClick={() => navigate("/agents")}>
              <Bot className="w-4 h-4" /> New Agent
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => navigate("/workflows")}>
              <GitBranch className="w-4 h-4" /> New Workflow
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => navigate("/providers")}>
              <Activity className="w-4 h-4" /> Add Provider
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => navigate("/tools")}>
              <FileText className="w-4 h-4" /> New Tool
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-foreground mb-4">Recent Runs</h2>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">No runs yet. Trigger a workflow to see results.</p>
          ) : (
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted">{run.id.slice(0, 8)}</span>
                    <Badge variant={run.status === "completed" ? "success" : run.status === "running" ? "info" : run.status === "failed" ? "danger" : "default"}>
                      {run.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted">{run.started_at ? new Date(run.started_at).toLocaleDateString() : ""}</span>
                </div>
              ))}
            </div>
          )}
          {recentRuns.length > 0 && (
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => navigate("/runs")}>
              View all runs
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
}
