/** Runs screen — filterable list + detail view with timeline, live log, messages, cost. */

import { useState } from "react"
import { useRuns, useRunEvents } from "../api/runs"
import { useWorkflows } from "../api/workflows"
import { useTriggerRun } from "../api/runs"
import LiveLogs from "../components/MonitorPanel/LiveLogs"
import MessageTrace from "../components/MonitorPanel/MessageTrace"
import { Button, Badge, Card, Input, Select, SkeletonRow } from "../components/ui"
import { Play, Activity } from "lucide-react"

export default function RunsPage() {
  const { data: runs, isLoading } = useRuns()
  const { data: workflows } = useWorkflows()
  const triggerRun = useTriggerRun()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [workflowId, setWorkflowId] = useState("")
  const [input, setInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { data: events } = useRunEvents(selectedId ?? "")

  const handleTrigger = () => {
    if (!workflowId) return
    triggerRun.mutate({ workflow_id: workflowId, input }, { onSuccess: (run) => setSelectedId(run.id) })
  }

  const selectedRun = runs?.find((r) => r.id === selectedId)
  const filtered = runs?.filter((r) => statusFilter === "all" || r.status === statusFilter) ?? []

  return (
    <div className="flex h-screen">
      {/* Runs list */}
      <div className="w-80 border-r border-border p-4 overflow-y-auto bg-card shrink-0">
        <h2 className="font-semibold text-foreground text-sm mb-4">▶️ Runs</h2>

        <div className="mb-4 p-3 rounded-lg border border-border bg-surface">
          <h3 className="text-xs font-medium text-foreground mb-2">Trigger Run</h3>
          <Select
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
            options={[{ value: "", label: "Select workflow..." }, ...(workflows?.map((w) => ({ value: w.id, label: w.name })) ?? [])]}
          />
          <Input className="mt-2" placeholder="Input message" value={input} onChange={(e) => setInput(e.target.value)} />
          <Button size="sm" className="mt-2 w-full" onClick={handleTrigger} disabled={!workflowId || triggerRun.isPending}>
            <Play className="w-3.5 h-3.5 mr-1" /> {triggerRun.isPending ? "Running..." : "Run"}
          </Button>
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "All runs" },
            { value: "completed", label: "Completed" },
            { value: "running", label: "Running" },
            { value: "failed", label: "Failed" },
            { value: "pending", label: "Pending" },
          ]}
        />

        <div className="space-y-2 mt-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          {filtered.map((run) => (
            <Card key={run.id} hover className={`p-3 cursor-pointer ${selectedId === run.id ? "ring-2 ring-accent" : ""}`} onClick={() => setSelectedId(run.id)}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted">#{run.id.slice(0, 6)}</span>
                <Badge variant={run.status === "completed" ? "success" : run.status === "running" ? "info" : run.status === "failed" ? "danger" : "default"}>{run.status}</Badge>
              </div>
              <p className="text-[10px] text-muted">{run.started_at ? new Date(run.started_at).toLocaleString() : "—"}</p>
              {run.finished_at && run.started_at && (
                <p className="text-[10px] text-muted mt-0.5">Duration: {((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1)}s</p>
              )}
            </Card>
          ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-xs text-muted text-center py-8">No runs found</p>
          )}
        </div>
      </div>

      {/* Run detail */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedRun ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Run #{selectedRun.id.slice(0, 8)}</h2>
                <p className="text-xs text-muted">
                  {selectedRun.started_at ? new Date(selectedRun.started_at).toLocaleString() : ""}
                  {selectedRun.finished_at && selectedRun.started_at
                    ? ` · ${((new Date(selectedRun.finished_at).getTime() - new Date(selectedRun.started_at).getTime()) / 1000).toFixed(1)}s`
                    : ""}
                </p>
              </div>
              <Badge variant={selectedRun.status === "completed" ? "success" : selectedRun.status === "running" ? "info" : selectedRun.status === "failed" ? "danger" : "default"} className="text-sm px-3 py-1">
                {selectedRun.status}
              </Badge>
            </div>

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

            <Card>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Token & Cost Tracker</h3>
              {events && events.length > 0 ? (
                <div className="space-y-2">
                  {events.filter((e) => e.type === "agent_start" || e.type === "agent_end").map((e) => (
                    <div key={e.id} className="flex justify-between text-xs text-muted py-1 border-b border-border last:border-0">
                      <span>{e.agent_id}</span>
                      <span className="font-mono">{e.type === "agent_end" ? "Completed" : "Started"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">Waiting for data...</p>
              )}
            </Card>
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
