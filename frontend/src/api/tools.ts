import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/Toast"
import { apiFetch } from "./client"

export interface Tool { id?: string; tool_id?: string; name: string; description: string; tool_type: string; config?: Record<string, unknown>; is_builtin: boolean; created_at?: string }
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

// Test a built-in tool by name
export async function testBuiltinTool(name: string, input: string): Promise<{ ok: boolean; output: string; duration_ms: number }> {
  return apiFetch("/tools/test", { method: "POST", body: JSON.stringify({ tool_id: name, input }) })
}

// Tool export/import
export async function exportAllTools(): Promise<void> {
  const data = await apiFetch<Record<string, unknown>[]>("/tools/export")
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `cerebra-tools-${new Date().toISOString().slice(0, 10)}.json`
  a.click(); URL.revokeObjectURL(url)
}

export function useImportTools() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({
    mutationFn: (tools: Record<string, unknown>[]) => apiFetch<{ imported: number }>("/tools/import", { method: "POST", body: JSON.stringify(tools) }),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["tools"] }); toast("success", `Imported ${data.imported} tools`) },
    onError: (e: Error) => toast("error", e.message),
  })
}
