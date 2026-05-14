/** Live log streamer — modern dark theme, monospace, auto-scroll, connection status. */

import { useEffect, useRef, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"

interface LogEntry { timestamp: string; type: string; agent_id: string; payload: Record<string, unknown> }
interface Props { runId: string }

const typeColors: Record<string, string> = {
  run_start: "text-accent",
  run_end: "text-emerald-500",
  run_error: "text-rose-500",
  agent_start: "text-cyan-500",
  agent_end: "text-emerald-500",
  error: "text-rose-500",
}

export default function LiveLogs({ runId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    const token = localStorage.getItem("cerebra-auth-key") || ""
    const ws = new WebSocket(`${protocol}//${host}/ws/runs/${runId}${token ? `?token=${encodeURIComponent(token)}` : ""}`)
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (event) => {
      try { setLogs((prev) => [...prev, JSON.parse(event.data)]) } catch { /* ignore */ }
    }
    return () => ws.close()
  }, [runId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-accent-soft/30">
        {connected ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-muted" />}
        <span className="text-xs font-medium text-foreground">{connected ? "Connected" : "Disconnected"}</span>
        <span className="text-[10px] text-muted ml-auto">{logs.length} events</span>
      </div>
      <div className="h-56 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-1.5 bg-surface/50">
        {logs.length === 0 && (
          <p className="text-muted italic">Waiting for events...</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-muted shrink-0 w-14">{new Date(log.timestamp).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}</span>
            <span className={`shrink-0 font-semibold ${typeColors[log.type] || "text-muted"}`}>{log.type}</span>
            <span className="text-muted shrink-0">{log.agent_id}</span>
            <span className="text-foreground/70 truncate">{JSON.stringify(log.payload).slice(0, 120)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
