import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const BASE = "/api"

export interface Run {
  id: string
  workflow_id: string
  status: string
  started_at: string | null
  finished_at: string | null
}

export interface RunEvent {
  id: number
  run_id: string
  timestamp: string
  type: string
  agent_id: string
  payload: Record<string, unknown>
}

async function fetchRuns(): Promise<Run[]> {
  const res = await fetch(`${BASE}/runs`)
  if (!res.ok) throw new Error("Failed to fetch runs")
  return res.json()
}

async function fetchRun(id: string): Promise<Run> {
  const res = await fetch(`${BASE}/runs/${id}`)
  if (!res.ok) throw new Error("Run not found")
  return res.json()
}

async function fetchRunEvents(id: string): Promise<RunEvent[]> {
  const res = await fetch(`${BASE}/runs/${id}/events`)
  if (!res.ok) throw new Error("Failed to fetch events")
  return res.json()
}

async function triggerRun(workflow_id: string, input: string): Promise<Run> {
  const res = await fetch(`${BASE}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_id, input }),
  })
  if (!res.ok) throw new Error("Failed to trigger run")
  return res.json()
}

export function useRuns() {
  return useQuery({ queryKey: ["runs"], queryFn: fetchRuns })
}

export function useRun(id: string) {
  return useQuery({ queryKey: ["runs", id], queryFn: () => fetchRun(id), enabled: !!id })
}

export function useRunEvents(id: string) {
  return useQuery({ queryKey: ["runs", id, "events"], queryFn: () => fetchRunEvents(id), enabled: !!id })
}

export function useTriggerRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workflow_id, input }: { workflow_id: string; input: string }) => triggerRun(workflow_id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["runs"] }),
    onError: (e: Error) => alert(e.message),
  })
}
