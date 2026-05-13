import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../components/ui/Toast"
import { apiFetch } from "./client"

export interface Run { id: string; workflow_id: string; status: string; started_at: string | null; finished_at: string | null }
export interface RunEvent { id: number; run_id: string; timestamp: string; type: string; agent_id: string; payload: Record<string, unknown> }

const fetchRuns = () => apiFetch<Run[]>("/runs")
const fetchRun = (id: string) => apiFetch<Run>(`/runs/${id}`)
const fetchRunEvents = (id: string) => apiFetch<RunEvent[]>(`/runs/${id}/events`)
const triggerRun = (workflow_id: string, input: string) => apiFetch<Run>("/runs", { method: "POST", body: JSON.stringify({ workflow_id, input }) })

export function useRuns() { return useQuery({ queryKey: ["runs"], queryFn: fetchRuns }) }
export function useRun(id: string) { return useQuery({ queryKey: ["runs", id], queryFn: () => fetchRun(id), enabled: !!id }) }
export function useRunEvents(id: string) { return useQuery({ queryKey: ["runs", id, "events"], queryFn: () => fetchRunEvents(id), enabled: !!id }) }

export function useTriggerRun() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({
    mutationFn: ({ workflow_id, input }: { workflow_id: string; input: string }) => triggerRun(workflow_id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["runs"] }); toast("success", "Run triggered") },
    onError: (e: Error) => toast("error", e.message),
  })
}
