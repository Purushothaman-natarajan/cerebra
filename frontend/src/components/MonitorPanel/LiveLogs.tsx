/** Live log — WebSocket with polling fallback, heartbeat, and exponential backoff reconnect. */

import { useEffect, useRef, useState, useCallback } from "react"
import { Wifi, RefreshCw } from "lucide-react"
import { apiFetch } from "@/api/client"

const PING_INTERVAL_MS = 25_000      // Send ping every 25s
const PONG_TIMEOUT_MS = 10_000       // Wait 10s for pong before considering dead
const RECONNECT_BASE_MS = 1_000      // Initial reconnect delay (1s)
const RECONNECT_MAX_MS = 30_000      // Max reconnect delay (30s)
const POLL_INTERVAL_MS = 3_000       // Fallback polling interval

interface LogEntry { timestamp: string; type: string; agent_id?: string | null; payload: Record<string, unknown> }
interface LogPayload { level?: string; source?: string; component?: string; action?: string; message?: string; details?: Record<string, unknown> }
interface Props { runId: string }

const typeColors: Record<string, string> = {
  run_start: "text-accent", run_end: "text-emerald-500", run_error: "text-rose-500",
  agent_start: "text-cyan-500", agent_end: "text-emerald-500", error: "text-rose-500",
  log: "text-muted",
}

export default function LiveLogs({ runId }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [polling, setPolling] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastMessageRef = useRef<number>(Date.now())
  const reconnectDelayRef = useRef<number>(RECONNECT_BASE_MS)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isMounted = useRef(true)
  useEffect(() => { return () => { isMounted.current = false } }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    setPolling(true)
    pollRef.current = setInterval(async () => {
      try {
        const events = await apiFetch<LogEntry[]>(`/runs/${runId}/events`)
        if (isMounted.current) setLogs(events)
      } catch { /* backend might be down */ }
    }, POLL_INTERVAL_MS)
  }, [runId])

  const stopPing = useCallback(() => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null }
  }, [])

  // WebSocket connection with heartbeat and exponential backoff reconnect
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    const token = localStorage.getItem("cerebra-auth-key") || ""
    const wsUrl = `${protocol}//${host}/ws/runs/${runId}${token ? `?token=${encodeURIComponent(token)}` : ""}`

    function startPing(ws: WebSocket) {
      stopPing()
      lastMessageRef.current = Date.now()
      // Send silent pings and check for stale connection
      pingRef.current = setInterval(() => {
        const elapsed = Date.now() - lastMessageRef.current
        if (elapsed > PONG_TIMEOUT_MS + PING_INTERVAL_MS) {
          // No messages received for too long — connection is dead
          ws.close()
        }
        // Send a ping-type message (backend will echo or ignore)
        try { ws.send(JSON.stringify({ type: "ping" })) } catch { /* ignore */ }
      }, PING_INTERVAL_MS)
    }

    function connect() {
      if (!isMounted.current) return
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (!isMounted.current) { ws.close(); return }
        setConnected(true)
        setPolling(false)
        stopPolling()
        reconnectDelayRef.current = RECONNECT_BASE_MS
        startPing(ws)
        // Fetch existing events — run may have completed before WS connected
        apiFetch<LogEntry[]>(`/runs/${runId}/events`).then((events) => {
          if (isMounted.current) setLogs(events)
        }).catch(() => {})
      }

      ws.onmessage = (event) => {
        lastMessageRef.current = Date.now()
        try {
          const data = JSON.parse(event.data)
          // Echo back pong to keep heartbeat alive
          if (data.type === "pong") return
          if (data.type === "error" && data.payload?.message === "Event bus unavailable") {
            ws.close()
            return
          }
          if (isMounted.current) setLogs((prev) => [...prev, data])
        } catch { /* ignore */ }
      }

      ws.onclose = () => {
        if (!isMounted.current) return
        setConnected(false)
        stopPing()
        startPolling()
        // Schedule reconnect with exponential backoff
        const delay = reconnectDelayRef.current
        reconnectTimerRef.current = setTimeout(() => {
          if (isMounted.current) {
            reconnectDelayRef.current = Math.min(delay * 2, RECONNECT_MAX_MS)
            connect()
          }
        }, delay)
      }

      ws.onerror = () => { ws.close() }
    }

    connect()
    return () => {
      stopPolling()
      stopPing()
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [runId, startPolling, stopPolling, stopPing])

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
        {logs.map((log, i) => {
          const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }) : ""
          // If this is a frontend log published as type 'log', render a friendlier line
          if (log.type === "log") {
            const p = (log.payload ?? {}) as LogPayload
            const level = (p.level || "info").toLowerCase()
            const comp = p.component || p.source || "frontend"
            const msg = p.message || ""
            const details = p.details ? JSON.stringify(p.details) : ""
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="text-muted shrink-0 w-14">{time}</span>
                <span className={`shrink-0 font-semibold ${typeColors[level] || "text-muted"}`}>{level}</span>
                <span className="text-muted shrink-0">{comp}</span>
                <div className="text-foreground/70 whitespace-pre-wrap break-words max-h-20 overflow-y-auto">
                  <span className="font-medium">{msg}</span>
                  {details ? <div className="text-xs text-muted mt-1">{details.slice(0, 500)}</div> : null}
                </div>
              </div>
            )
          }

          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-muted shrink-0 w-14">{time}</span>
              <span className={`shrink-0 font-semibold ${typeColors[log.type] || "text-muted"}`}>{log.type}</span>
              <span className="text-muted shrink-0">{log.agent_id}</span>
              <span className="text-foreground/70 whitespace-pre-wrap break-words max-h-20 overflow-y-auto">{JSON.stringify(log.payload).slice(0, 2000)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
