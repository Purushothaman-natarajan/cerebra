import type { RunEvent } from "../../api/runs"

interface Props {
  events: RunEvent[]
}

export default function MessageTrace({ events }: Props) {
  const agentEvents = events.filter((e) =>
    ["agent_start", "agent_end", "message", "tool_call", "run_start", "run_end", "run_error"].includes(e.type)
  )

  const dotColor: Record<string, string> = {
    run_start: "bg-blue-500", run_end: "bg-emerald-500", run_error: "bg-rose-500",
    agent_start: "bg-cyan-500", agent_end: "bg-emerald-500",
    tool_call: "bg-amber-500", message: "bg-violet-500",
  }
  const typeColor: Record<string, string> = {
    run_start: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    run_end: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    run_error: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20",
    agent_start: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20",
    agent_end: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    tool_call: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    message: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20",
  }

  if (agentEvents.length === 0) return <p className="text-sm text-gray-400">No events yet</p>

  return (
    <div className="space-y-2">
      {agentEvents.map((event) => {
        const raw = JSON.stringify(event.payload)
        const display = raw.length > 2000 ? raw.slice(0, 2000) + "..." : raw
        return (
          <div key={event.id} className="flex items-start gap-3 text-sm">
            <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${dotColor[event.type] || "bg-gray-400"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">{event.agent_id}</span>
                <span className="text-[10px] text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor[event.type] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{event.type}</span>
              </div>
              <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                {display}
              </pre>
            </div>
          </div>
        )
      })}
    </div>
  )
}
