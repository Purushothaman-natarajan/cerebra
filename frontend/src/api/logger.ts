export interface LogEntry {
  timestamp: string
  level: "debug" | "info" | "warn" | "error"
  source: string
  component?: string
  action?: string
  message?: string
  run_id?: string | null
  details?: Record<string, unknown> | null
}

const BASE = "/api"

export async function logToServer(entry: LogEntry): Promise<void> {
  try {
    await fetch(`${BASE}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    })
  } catch {
    // swallow errors — logging must not break app flow
  }
}

export function makeLogEntry(overrides: Partial<LogEntry>) : LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: "info",
    source: "frontend",
    component: overrides.component || "unknown",
    action: overrides.action || "",
    message: overrides.message || "",
    run_id: overrides.run_id || null,
    details: overrides.details || null,
  }
}
