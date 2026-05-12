import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const BASE = "/api"

export interface WorkflowNode {
  id: string
  type: "agent" | "router"
  config: Record<string, unknown>
}

export interface WorkflowEdge {
  source: string
  target: string
  condition: string | null
  fallback?: string
}

export interface Workflow {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  trigger: { type: string; config: Record<string, unknown> }
  created_at: string
  updated_at: string
}

export interface WorkflowFormData {
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  trigger: { type: string; config: Record<string, unknown> }
}

async function fetchWorkflows(): Promise<Workflow[]> {
  const res = await fetch(`${BASE}/workflows`)
  if (!res.ok) throw new Error("Failed to fetch workflows")
  return res.json()
}

async function fetchWorkflow(id: string): Promise<Workflow> {
  const res = await fetch(`${BASE}/workflows/${id}`)
  if (!res.ok) throw new Error("Workflow not found")
  return res.json()
}

async function createWorkflow(data: WorkflowFormData): Promise<Workflow> {
  const res = await fetch(`${BASE}/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create workflow")
  return res.json()
}

async function updateWorkflow(id: string, data: Partial<WorkflowFormData>): Promise<Workflow> {
  const res = await fetch(`${BASE}/workflows/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update workflow")
  return res.json()
}

async function deleteWorkflow(id: string): Promise<void> {
  const res = await fetch(`${BASE}/workflows/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete workflow")
}

export function useWorkflows() {
  return useQuery({ queryKey: ["workflows"], queryFn: fetchWorkflows })
}

export function useWorkflow(id: string) {
  return useQuery({ queryKey: ["workflows", id], queryFn: () => fetchWorkflow(id), enabled: !!id })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
    onError: (e: Error) => alert(e.message),
  })
}

export function useUpdateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkflowFormData> }) => updateWorkflow(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
    onError: (e: Error) => alert(e.message),
  })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
    onError: (e: Error) => alert(e.message),
  })
}
