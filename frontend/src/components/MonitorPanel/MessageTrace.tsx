import type { RunEvent } from "../../api/runs"

interface Props {
  events: RunEvent[]
}

export default function MessageTrace({ events }: Props) {
  const agentEvents = events.filter((e) => e.type === "agent_start" || e.type === "agent_end" || e.type === "message")

  if (agentEvents.length === 0) return <p className="text-sm text-gray-400">No events yet</p>

  return (
    <div className="space-y-2">
      {agentEvents.map((event) => {
        const raw = JSON.stringify(event.payload)
        const display = raw.length > 2000 ? raw.slice(0, 2000) + "..." : raw
        return (
          <div key={event.id} className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">{event.agent_id}</span>
                <span className="text-[10px] text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{event.type}</span>
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
