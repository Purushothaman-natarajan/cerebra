import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/Toast"
import { apiFetch } from "./client"

export interface AgentTemplate {
  id: string
  name: string
  role: string
  system_prompt: string
  model: string
  tools: string[]
  memory_enabled: boolean
  max_iterations: number
  guardrails: { blocked_topics?: string[]; max_tokens?: number }
  is_default: boolean
  created_at: string
}

export interface Agent {
  id: string
  name: string
  role: string
  system_prompt: string
  model: string
  tools: string[]
  channel_id: string | null
  provider_id?: string | null | undefined
  memory_enabled: boolean
  max_iterations: number
  guardrails: { blocked_topics?: string[]; max_tokens?: number }
  is_default?: boolean
  created_at: string
  updated_at: string
}

export interface AgentFormData {
  name: string
  role: string
  system_prompt: string
  model: string
  provider_id?: string | null
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

// Agent templates
const fetchAgentTemplates = () => apiFetch<AgentTemplate[]>("/agent-templates")

export function useAgentTemplates() {
  return useQuery({ queryKey: ["agent-templates"], queryFn: fetchAgentTemplates })
}

// Agent export/import
export async function exportAllAgents(): Promise<void> {
  const data = await apiFetch<Record<string, unknown>[]>("/agents/export")
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `cerebra-agents-${new Date().toISOString().slice(0, 10)}.json`
  a.click(); URL.revokeObjectURL(url)
}

export function useImportAgents() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({
    mutationFn: (agents: Record<string, unknown>[]) => apiFetch<{ imported: number }>("/agents/import", { method: "POST", body: JSON.stringify(agents) }),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["agents"] }); toast("success", `Imported ${data.imported} agents`) },
    onError: (e: Error) => toast("error", e.message),
  })
}

// Test an agent
export async function testAgent(id: string, input: string): Promise<{ ok: boolean; output: string; prompt_tokens: number; completion_tokens: number; total_tokens: number; cost: number; duration_ms: number }> {
  return apiFetch(`/agents/${id}/test`, { method: "POST", body: JSON.stringify({ input }) })
}
