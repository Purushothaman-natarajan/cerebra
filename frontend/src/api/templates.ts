import { useQuery } from "@tanstack/react-query"
import type { WorkflowFormData } from "./workflows"

const BASE = "/api"

export interface Template {
  name: string
  description: string
  node_count: number
  edge_count: number
  trigger_type: string
  nodes: WorkflowFormData["nodes"]
  edges: WorkflowFormData["edges"]
  trigger: WorkflowFormData["trigger"]
}

async function fetchTemplates(): Promise<Template[]> {
  const res = await fetch(`${BASE}/templates`)
  if (!res.ok) throw new Error("Failed to fetch templates")
  return res.json()
}

export function useTemplates() {
  return useQuery({ queryKey: ["templates"], queryFn: fetchTemplates })
}
