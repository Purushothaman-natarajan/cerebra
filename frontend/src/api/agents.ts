import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../components/ui/Toast"
import { apiFetch } from "./client"

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

const fetchAgents = () => apiFetch<Agent[]>("/agents")
const fetchAgent = (id: string) => apiFetch<Agent>(`/agents/${id}`)
const createAgent = (data: AgentFormData) => apiFetch<Agent>("/agents", { method: "POST", body: JSON.stringify(data) })
const updateAgent = (id: string, data: Partial<AgentFormData>) => apiFetch<Agent>(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(data) })
const deleteAgent = (id: string) => apiFetch<void>(`/agents/${id}`, { method: "DELETE" })

export function useAgents() { return useQuery({ queryKey: ["agents"], queryFn: fetchAgents }) }
export function useAgent(id: string) { return useQuery({ queryKey: ["agents", id], queryFn: () => fetchAgent(id), enabled: !!id }) }

export function useCreateAgent() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: createAgent, onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents"] }); toast("success", "Agent created") }, onError: (e: Error) => toast("error", e.message) })
}

export function useUpdateAgent() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<AgentFormData> }) => updateAgent(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents"] }); toast("success", "Agent updated") }, onError: (e: Error) => toast("error", e.message) })
}

export function useDeleteAgent() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: deleteAgent, onSuccess: () => { qc.invalidateQueries({ queryKey: ["agents"] }); toast("success", "Agent deleted") }, onError: (e: Error) => toast("error", e.message) })
}
