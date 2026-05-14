/** Live log — WebSocket with polling fallback for when Redis/backend is unavailable. */

import { useEffect, useRef, useState } from "react"
import { Wifi, RefreshCw } from "lucide-react"
import { apiFetch } from "@/api/client"

interface LogEntry { timestamp: string; type: string; agent_id: string; payload: Record<string, unknown> }
interface Props { runId: string }

const typeColors: Record<string, string> = {
  run_start: "text-accent", run_end: "text-emerald-500", run_error: "text-rose-500",
  agent_start: "text-cyan-500", agent_end: "text-emerald-500", error: "text-rose-500",
}

export default function LiveLogs({ runId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [polling, setPolling] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isMounted = useRef(true)
  useEffect(() => { return () => { isMounted.current = false } }, [])

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    const token = localStorage.getItem("cerebra-auth-key") || ""
    const wsUrl = `${protocol}//${host}/ws/runs/${runId}${token ? `?token=${encodeURIComponent(token)}` : ""}`

    function connect() {
      if (!isMounted.current) return
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => { if (isMounted.current) { setConnected(true); setPolling(false); stopPolling() } }
      ws.onclose = () => { if (isMounted.current) { setConnected(false); startPolling() } }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "error" && data.payload?.message === "Event bus unavailable") {
            ws.close()
            return
          }
          if (isMounted.current) setLogs((prev) => [...prev, data])
        } catch { /* ignore */ }
      }
    }

    function startPolling() {
      if (pollRef.current) return
      setPolling(true)
      pollRef.current = setInterval(async () => {
        try {
          const events = await apiFetch<LogEntry[]>(`/runs/${runId}/events`)
          if (isMounted.current && events.length > 0) setLogs(events)
        } catch { /* backend might be down */ }
      }, 3000)
    }

    function stopPolling() {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }

    connect()
    return () => { stopPolling(); wsRef.current?.close() }
  }, [runId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-accent-soft/30">
        {connected ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <RefreshCw className={`w-3.5 h-3.5 text-muted ${polling ? "animate-spin" : ""}`} />}
        <span className="text-xs font-medium text-foreground">
          {connected ? "Connected" : polling ? "Polling..." : "Disconnected"}
        </span>
        <span className="text-[10px] text-muted ml-auto">{logs.length} events</span>
      </div>
      <div className="h-56 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-1.5 bg-surface/50">
        {logs.length === 0 && <p className="text-muted italic">Waiting for events...</p>}
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-muted shrink-0 w-14">
              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }) : ""}
            </span>
            <span className={`shrink-0 font-semibold ${typeColors[log.type] || "text-muted"}`}>{log.type}</span>
            <span className="text-muted shrink-0">{log.agent_id}</span>
            <span className="text-foreground/70 whitespace-pre-wrap break-words max-h-20 overflow-y-auto">{JSON.stringify(log.payload).slice(0, 2000)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
