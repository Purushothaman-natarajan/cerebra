import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../components/ui/Toast"
import { apiFetch } from "./client"

export interface Tool { id?: string; name: string; description: string; tool_type: string; config?: Record<string, unknown>; is_builtin: boolean; created_at?: string }
export interface ToolFormData { name: string; description: string; tool_type: "http" | "python" | "webhook"; config: { url?: string; method?: string; headers?: Record<string, string>; parameters?: { name: string; type: "string" | "number" | "boolean"; description: string }[]; code?: string } }

const fetchTools = () => apiFetch<Tool[]>("/tools")
const createTool = (data: ToolFormData) => apiFetch<Tool>("/tools", { method: "POST", body: JSON.stringify(data) })
const deleteTool = (id: string) => apiFetch<void>(`/tools/${id}`, { method: "DELETE" })

export function useTools() { return useQuery({ queryKey: ["tools"], queryFn: fetchTools }) }
export function useAgentTools() { return useQuery({ queryKey: ["tools"], queryFn: fetchTools }) }

export function useCreateTool() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: createTool, onSuccess: () => { qc.invalidateQueries({ queryKey: ["tools"] }); toast("success", "Tool created") }, onError: (e: Error) => toast("error", e.message) })
}

export function useDeleteTool() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: deleteTool, onSuccess: () => { qc.invalidateQueries({ queryKey: ["tools"] }); toast("success", "Tool deleted") }, onError: (e: Error) => toast("error", e.message) })
}
