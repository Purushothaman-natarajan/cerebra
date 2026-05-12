import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const BASE = "/api"

export interface Agent {
  id: string
  name: string
  role: string
  system_prompt: string
  model: string
  tools: string[]
  channel_id: string | null
  memory_enabled: boolean
  max_iterations: number
  guardrails: { blocked_topics?: string[]; max_tokens?: number }
  created_at: string
  updated_at: string
}

export interface AgentFormData {
  name: string
  role: string
  system_prompt: string
  model: string
  tools: string[]
  memory_enabled: boolean
  max_iterations: number
  guardrails: { blocked_topics: string[]; max_tokens: number }
}

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${BASE}/agents`)
  if (!res.ok) throw new Error("Failed to fetch agents")
  return res.json()
}

async function fetchAgent(id: string): Promise<Agent> {
  const res = await fetch(`${BASE}/agents/${id}`)
  if (!res.ok) throw new Error("Agent not found")
  return res.json()
}

async function createAgent(data: AgentFormData): Promise<Agent> {
  const res = await fetch(`${BASE}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create agent")
  return res.json()
}

async function updateAgent(id: string, data: Partial<AgentFormData>): Promise<Agent> {
  const res = await fetch(`${BASE}/agents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update agent")
  return res.json()
}

async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`${BASE}/agents/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete agent")
}

export function useAgents() {
  return useQuery({ queryKey: ["agents"], queryFn: fetchAgents })
}

export function useAgent(id: string) {
  return useQuery({ queryKey: ["agents", id], queryFn: () => fetchAgent(id), enabled: !!id })
}

export function useCreateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
    onError: (e: Error) => alert(e.message),
  })
}

export function useUpdateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgentFormData> }) => updateAgent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
    onError: (e: Error) => alert(e.message),
  })
}

export function useDeleteAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
    onError: (e: Error) => alert(e.message),
  })
}
