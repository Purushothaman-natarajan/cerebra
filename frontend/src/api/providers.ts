import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const BASE = "/api"

export interface LLMProvider {
  id: string
  name: string
  provider_type: string
  base_url: string
  models: string[]
  is_active: boolean
  created_at: string
}

export interface ProviderFormData {
  name: string
  provider_type: string
  base_url: string
  api_key?: string
  models?: string[]
  is_active?: boolean
}

export interface AvailableModel {
  model: string
  provider_name: string
  provider_type: string
  provider_id: string
}

export interface Preset {
  type: string
  label: string
  base_url: string
}

async function fetchProviders(): Promise<LLMProvider[]> {
  const res = await fetch(`${BASE}/providers`)
  if (!res.ok) throw new Error("Failed to fetch providers")
  return res.json()
}

async function createProvider(data: ProviderFormData): Promise<LLMProvider> {
  const res = await fetch(`${BASE}/providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create provider")
  return res.json()
}

async function deleteProvider(id: string): Promise<void> {
  const res = await fetch(`${BASE}/providers/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete provider")
}

async function fetchModels(): Promise<AvailableModel[]> {
  const res = await fetch(`${BASE}/providers/models`)
  if (!res.ok) throw new Error("Failed to fetch models")
  return res.json()
}

async function fetchPresets(): Promise<Preset[]> {
  const res = await fetch(`${BASE}/providers/presets`)
  if (!res.ok) throw new Error("Failed to fetch presets")
  return res.json()
}

export function useProviders() {
  return useQuery({ queryKey: ["providers"], queryFn: fetchProviders })
}

export function useCreateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProvider,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["providers"] }); qc.invalidateQueries({ queryKey: ["models"] }) },
    onError: (e: Error) => alert(e.message),
  })
}

export function useDeleteProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["providers"] }); qc.invalidateQueries({ queryKey: ["models"] }) },
    onError: (e: Error) => alert(e.message),
  })
}

export function useAvailableModels() {
  return useQuery({ queryKey: ["models"], queryFn: fetchModels })
}

export function usePresets() {
  return useQuery({ queryKey: ["presets"], queryFn: fetchPresets })
}
