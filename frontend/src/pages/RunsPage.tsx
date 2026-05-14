/** Runs screen — filterable list + detail timeline with agent traces, timing, cost estimates. */

import { useState } from "react"
import { useRuns, useRunEvents, useTriggerRun } from "@/api/runs"
import LiveLogs from "@/components/MonitorPanel/LiveLogs"
import MessageTrace from "@/components/MonitorPanel/MessageTrace"
import { Badge, Card, Select, SkeletonRow } from "@/components/ui"
import { Activity, Clock, DollarSign, CheckCircle, XCircle, Loader2, FileText, RefreshCw, Play } from "lucide-react"

const statusIcon: Record<string, typeof CheckCircle> = {
  completed: CheckCircle, failed: XCircle, running: Loader2, pending: Clock,
}
const statusColor: Record<string, string> = {
  completed: "text-emerald-500", failed: "text-rose-500", running: "text-cyan-500", pending: "text-muted",
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

export default function RunsPage() {
  const { data: runs, isLoading, refetch } = useRuns()
  const { mutate: triggerRun } = useTriggerRun()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const { data: events } = useRunEvents(selectedId ?? "")

  const selectedRun = runs?.find((r) => r.id === selectedId)
  const filtered = runs?.filter((r) => statusFilter === "all" || r.status === statusFilter) ?? []

  // Calculate timing info from events
  const agentTimings = events?.reduce<Record<string, { start: string; end?: string; count: number }>>((acc, e) => {
    if (e.type === "agent_start") {
      if (!acc[e.agent_id]) acc[e.agent_id] = { start: e.timestamp, count: 0 }
      acc[e.agent_id].start = e.timestamp
      acc[e.agent_id].count++
    }
    if (e.type === "agent_end" && acc[e.agent_id]) {
      acc[e.agent_id].end = e.timestamp
    }
    return acc
  }, {}) ?? {}

  const realCost = selectedRun?.cost ?? 0
  const realTokens = selectedRun?.total_tokens ?? 0

  // Extract final output from run_end event
  const runEndEvent = events?.find((e) => e.type === "run_end")
  const runOutput: string = runEndEvent?.payload?.messages as string || ""
  const runErrorEvent = events?.find((e) => e.type === "run_error")
  const runError: string = runErrorEvent?.payload?.error as string || ""

  return (
    <div className="flex h-full">
      {/* Runs list */}
      <div className="w-60 border-r border-border overflow-y-auto bg-card shrink-0 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-sm">Runs</h2>
            <button onClick={() => refetch()} className="p-1 rounded-lg hover:bg-accent-soft transition-colors text-muted hover:text-foreground" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All runs" }, { value: "completed", label: "Completed" },
              { value: "running", label: "Running" }, { value: "failed", label: "Failed" },
            ]}
          />
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          {filtered.map((run) => {
            const Icon = statusIcon[run.status] || Activity
            const color = statusColor[run.status] || "text-muted"
            const duration = run.started_at && run.finished_at
              ? new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()
              : null
            return (
              <Card key={run.id} hover className={`p-3 cursor-pointer ${selectedId === run.id ? "ring-2 ring-accent" : ""}`} onClick={() => setSelectedId(run.id)}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color} ${run.status === "running" ? "animate-spin" : ""}`} />
                  <span className="text-xs font-mono text-muted">#{run.id.slice(0, 6)}</span>
                  <Badge variant={run.status === "completed" ? "success" : run.status === "running" ? "info" : run.status === "failed" ? "danger" : "default"} className="ml-auto">{run.status}</Badge>
                </div>
                <p className="text-[10px] text-muted">{run.started_at ? new Date(run.started_at).toLocaleString() : "—"}</p>
                {duration && <p className="text-[10px] text-muted mt-0.5">{formatDuration(duration)}</p>}
                {run.total_tokens > 0 && <p className="text-[10px] text-muted mt-0.5">{run.total_tokens} tok · ${run.cost.toFixed(6)}</p>}
              </Card>
            )
          })}
          {!isLoading && filtered.length === 0 && (
            <p className="text-xs text-muted text-center py-8">No runs found</p>
          )}
        </div>
      </div>

      {/* Run detail */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {selectedRun ? (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-foreground">Run #{selectedRun.id.slice(0, 8)}</h2>
                  <Badge variant={selectedRun.status === "completed" ? "success" : selectedRun.status === "running" ? "info" : selectedRun.status === "failed" ? "danger" : "default"}>{selectedRun.status}</Badge>
                </div>
                <p className="text-xs text-muted">
                  {selectedRun.started_at ? new Date(selectedRun.started_at).toLocaleString() : ""}
                  {selectedRun.started_at && selectedRun.finished_at
                    ? ` · ${formatDuration(new Date(selectedRun.finished_at).getTime() - new Date(selectedRun.started_at).getTime())}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-accent-soft transition-colors text-muted hover:text-foreground" title="Refresh run details">
                  <RefreshCw className="w-4 h-4" />
                </button>
                {selectedRun.status !== "running" && selectedRun.workflow_id && (
                  <button onClick={() => triggerRun({ workflow_id: selectedRun.workflow_id, input: "" })} className="p-2 rounded-lg hover:bg-accent-soft transition-colors text-muted hover:text-foreground" title="Rerun this workflow">
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="flex items-center gap-3 p-3">
                <Activity className="w-4 h-4 text-muted shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground">{events?.length || 0}</p>
                  <p className="text-[10px] text-muted">Events</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3 p-3">
                <FileText className="w-4 h-4 text-muted shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground">{realTokens.toLocaleString()}</p>
                  <p className="text-[10px] text-muted">Tokens</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3 p-3">
                <DollarSign className="w-4 h-4 text-muted shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground">${realCost.toFixed(6)}</p>
                  <p className="text-[10px] text-muted">Cost (USD)</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3 p-3">
                <Loader2 className="w-4 h-4 text-muted shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground">{events?.filter((e) => e.type === "tool_call").length || 0}</p>
                  <p className="text-[10px] text-muted">Tool calls</p>
                </div>
              </Card>
            </div>

            {/* Agent trace timeline */}
            {Object.keys(agentTimings).length > 0 && (
              <Card>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Agent Timeline</h3>
                <div className="space-y-2">
                  {Object.entries(agentTimings).map(([agentId, timing]) => {
                    const duration = timing.end
                      ? new Date(timing.end).getTime() - new Date(timing.start).getTime()
                      : null
                    return (
                      <div key={agentId} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                        <div className={`w-2 h-2 rounded-full ${timing.end ? "bg-emerald-500" : "bg-cyan-500 animate-pulse"}`} />
                        <span className="text-sm font-medium text-foreground flex-1">{agentId}</span>
                        <span className="text-xs text-muted">{timing.count} steps</span>
                        {duration && <span className="text-xs font-mono text-muted">{formatDuration(duration)}</span>}
                        {!timing.end && <Badge variant="info">running</Badge>}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Run Output */}
            {(runOutput || runError) && (
              <Card>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Output</h3>
                <pre className="text-sm text-foreground whitespace-pre-wrap break-words max-h-60 overflow-y-auto font-sans">
                  {runError ? (
                    <span className="text-rose-500">{runError}</span>
                  ) : (
                    runOutput
                  )}
                </pre>
              </Card>
            )}

            {/* Live Log + Trace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Live Log</h3>
                <LiveLogs runId={selectedRun.id} />
              </Card>
              <Card>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Event Trace</h3>
                <MessageTrace events={events ?? []} />
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Activity className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
              <p className="text-muted">Select a run to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}