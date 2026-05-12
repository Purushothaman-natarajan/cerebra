import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const BASE = "/api"

export interface Tool {
  id?: string
  name: string
  description: string
  tool_type: string
  config?: Record<string, unknown>
  is_builtin: boolean
  created_at?: string
}

export interface ToolFormData {
  name: string
  description: string
  tool_type: "http" | "python" | "webhook"
  config: {
    url?: string
    method?: string
    headers?: Record<string, string>
    parameters?: {
      name: string
      type: "string" | "number" | "boolean"
      description: string
    }[]
    code?: string
  }
}

async function fetchTools(): Promise<Tool[]> {
  const res = await fetch(`${BASE}/tools`)
  if (!res.ok) throw new Error("Failed to fetch tools")
  return res.json()
}

async function createTool(data: ToolFormData): Promise<Tool> {
  const res = await fetch(`${BASE}/tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create tool")
  return res.json()
}

async function deleteTool(id: string): Promise<void> {
  const res = await fetch(`${BASE}/tools/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete tool")
}

async function fetchAgentTools(): Promise<Tool[]> {
  const res = await fetch(`${BASE}/tools`)
  if (!res.ok) throw new Error("Failed to fetch tools")
  return res.json()
}

export function useTools() {
  return useQuery({ queryKey: ["tools"], queryFn: fetchTools })
}

export function useAgentTools() {
  return useQuery({ queryKey: ["tools"], queryFn: fetchAgentTools })
}

export function useCreateTool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTool,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools"] }),
    onError: (e: Error) => alert(e.message),
  })
}

export function useDeleteTool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTool,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools"] }),
    onError: (e: Error) => alert(e.message),
  })
}
