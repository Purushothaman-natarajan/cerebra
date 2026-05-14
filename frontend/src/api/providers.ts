import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/Toast"
import { apiFetch } from "./client"

export interface LLMProvider { id: string; name: string; provider_type: string; base_url: string; models: string[]; api_key?: string; is_active: boolean; created_at: string }
export interface ProviderFormData { name: string; provider_type: string; base_url: string; api_key?: string; models?: string[]; is_active?: boolean }
export interface AvailableModel { model: string; provider_name: string; provider_type: string; provider_id: string }
export interface Preset { type: string; label: string; base_url: string; key_hint?: string; key_example?: string }

const fetchProviders = () => apiFetch<LLMProvider[]>("/providers")
const createProvider = (data: ProviderFormData) => apiFetch<LLMProvider>("/providers", { method: "POST", body: JSON.stringify(data) })
const deleteProvider = (id: string) => apiFetch<void>(`/providers/${id}`, { method: "DELETE" })
const fetchModels = () => apiFetch<AvailableModel[]>("/providers/models")
const fetchPresets = () => apiFetch<Preset[]>("/providers/presets")

export function useProviders() { return useQuery({ queryKey: ["providers"], queryFn: fetchProviders }) }

export function useCreateProvider() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: createProvider, onSuccess: () => { qc.invalidateQueries({ queryKey: ["providers"] }); qc.invalidateQueries({ queryKey: ["models"] }); toast("success", "Provider added") }, onError: (e: Error) => toast("error", e.message) })
}

export function useDeleteProvider() {
  const qc = useQueryClient(); const { toast } = useToast()
  return useMutation({ mutationFn: deleteProvider, onSuccess: () => { qc.invalidateQueries({ queryKey: ["providers"] }); qc.invalidateQueries({ queryKey: ["models"] }); toast("success", "Provider removed") }, onError: (e: Error) => toast("error", e.message) })
}

export function useAvailableModels() { return useQuery({ queryKey: ["models"], queryFn: fetchModels }) }
export function usePresets() { return useQuery({ queryKey: ["presets"], queryFn: fetchPresets }) }
