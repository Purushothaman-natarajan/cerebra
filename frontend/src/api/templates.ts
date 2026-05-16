import { useQuery } from "@tanstack/react-query"
import type { WorkflowFormData } from "./workflows"
import { apiFetch } from "./client"

export interface Template {
  name: string; description: string; node_count: number; edge_count: number
  trigger_type: string; nodes: WorkflowFormData["nodes"]; edges: WorkflowFormData["edges"]; trigger: WorkflowFormData["trigger"]; category: string
}

const fetchTemplates = () => apiFetch<Template[]>("/templates")

export function useTemplates() { return useQuery({ queryKey: ["templates"], queryFn: fetchTemplates }) }
