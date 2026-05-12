import { useState } from "react"
import { useRuns, useRunEvents } from "../api/runs"
import { useWorkflows } from "../api/workflows"
import { useTriggerRun } from "../api/runs"
import LiveLogs from "../components/MonitorPanel/LiveLogs"
import MessageTrace from "../components/MonitorPanel/MessageTrace"

export default function RunsPage() {
  const { data: runs, isLoading } = useRuns()
  const { data: workflows } = useWorkflows()
  const triggerRun = useTriggerRun()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [workflowId, setWorkflowId] = useState("")
  const [input, setInput] = useState("")
  const { data: events } = useRunEvents(selectedId ?? "")

  const handleTrigger = () => {
    if (!workflowId) return
    triggerRun.mutate(
      { workflow_id: workflowId, input },
      { onSuccess: (run) => setSelectedId(run.id) }
    )
  }

  return (
    <div className="flex h-screen">
      <div className="w-72 border-r p-4 overflow-y-auto">
        <h2 className="font-semibold text-sm mb-4">Run History</h2>

        <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <h3 className="text-xs font-medium mb-2">Trigger Run</h3>
          <select
            className="w-full border rounded px-2 py-1 text-xs mb-2"
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
          >
            <option value="">Select workflow...</option>
            {workflows?.map((wf) => (
              <option key={wf.id} value={wf.id}>{wf.name}</option>
            ))}
          </select>
          <input
            className="w-full border rounded px-2 py-1 text-xs mb-2"
            placeholder="Input message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={handleTrigger}
            disabled={!workflowId || triggerRun.isPending}
            className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {triggerRun.isPending ? "Running..." : "Run"}
          </button>
        </div>

        {isLoading && <p className="text-xs text-gray-500">Loading...</p>}
        {runs?.map((run) => (
          <div
            key={run.id}
            onClick={() => setSelectedId(run.id)}
            className={`p-2 rounded cursor-pointer text-xs mb-1 ${
              selectedId === run.id ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{run.id.slice(0, 8)}...</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                run.status === "completed" ? "bg-green-100 text-green-700" :
                run.status === "running" ? "bg-blue-100 text-blue-700" :
                run.status === "failed" ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {run.status}
              </span>
            </div>
            {run.started_at && <p className="text-[10px] text-gray-400 mt-1">{new Date(run.started_at).toLocaleString()}</p>}
          </div>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {selectedId ? (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Run: {selectedId.slice(0, 8)}...</h2>
            <LiveLogs runId={selectedId} />
            <div>
              <h3 className="text-sm font-medium mb-2">Event Trace</h3>
              <MessageTrace events={events ?? []} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a run or trigger a new one
          </div>
        )}
      </div>
    </div>
  )
}
