import { useEffect, useRef, useState } from "react"

interface LogEntry {
  timestamp: string; type: string; agent_id: string; payload: Record<string, unknown>
}

interface Props { runId: string }

export default function LiveLogs({ runId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    const token = localStorage.getItem("cerebra-auth-key") || ""
    const wsUrl = `${protocol}//${host}/ws/runs/${runId}${token ? `?token=${encodeURIComponent(token)}` : ""}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLogs((prev) => [...prev, data])
      } catch { /* ignore */ }
    }

    return () => ws.close()
  }, [runId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

  return (
    <div className="border rounded-lg bg-black text-green-400 font-mono text-xs p-4 h-64 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
        <span className="text-gray-400">{connected ? "Connected" : "Disconnected"}</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="mb-1">
          <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>{" "}
          <span className="text-cyan-400">[{log.type}]</span>{" "}
          <span className="text-yellow-400">{log.agent_id}</span>{" "}
          <span>{JSON.stringify(log.payload).slice(0, 200)}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
