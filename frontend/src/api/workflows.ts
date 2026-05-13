import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../components/ui/Toast"
import { apiFetch } from "./client"

export interface WorkflowNode { id: string; type: "agent" | "router"; config: Record<string, unknown> }
export interface WorkflowEdge { source: string; target: string; condition: string | null; fallback?: string }
export interface Workflow {
  id: string; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]
  trigger: { type: string; config: Record<string, unknown> }; created_at: string; updated_at: string
}
export interface WorkflowFormData { name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; trigger: { type: string; config: Record<string, unknown> } }

const fetchWorkflows = () => apiFetch<Workflow[]>("/workflows")
const fetchWorkflow = (id: string) => apiFetch<Workflow>(`/workflows/${id}`)
const createWorkflow = (data: WorkflowFormData) => apiFetch<Workflow>("/workflows", { method: "POST", body: JSON.stringify(data) })
const updateWorkflow = (id: string, data: Partial<WorkflowFormData>) => apiFetch<Workflow>(`/workflows/${id}`, { method: "PATCH", body: JSON.stringify(data) })
const deleteWorkflow = (id: string) => apiFetch<void>(`/workflows/${id}`, { method: "DELETE" })

export function useWorkflows() { return useQuery({ queryKey: ["workflows"], queryFn: fetchWorkflows }) }
export function useWorkflow(id: string) { return useQuery({ queryKey: ["workflows", id], queryFn: () => fetchWorkflow(id), enabled: !!id }) }

export function useCreateWorkflow() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: createWorkflow, onSuccess: () => { qc.invalidateQueries({ queryKey: ["workflows"] }); toast("success", "Workflow created") }, onError: (e: Error) => toast("error", e.message) })
}

export function useUpdateWorkflow() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<WorkflowFormData> }) => updateWorkflow(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["workflows"] }); toast("success", "Workflow saved") }, onError: (e: Error) => toast("error", e.message) })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: deleteWorkflow, onSuccess: () => { qc.invalidateQueries({ queryKey: ["workflows"] }); toast("success", "Workflow deleted") }, onError: (e: Error) => toast("error", e.message) })
}
