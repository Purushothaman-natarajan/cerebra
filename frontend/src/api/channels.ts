import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/Toast"
import { apiFetch } from "./client"

export interface Channel {
  id: string
  name: string
  type: string
  config: Record<string, unknown>
  created_at: string
}

export interface ChannelFormData {
  name: string
  type: "telegram"
  config: {
    bot_token: string
    webhook_url?: string
    workflow_id?: string
  }
}

type TestResult = { ok: boolean; username?: string; description?: string }

const fetchChannels = () => apiFetch<Channel[]>("/channels")
const fetchChannel = (id: string) => apiFetch<Channel>(`/channels/${id}`)
const createChannel = (data: ChannelFormData) => apiFetch<Channel>("/channels", { method: "POST", body: JSON.stringify(data) })
const deleteChannel = (id: string) => apiFetch<{ ok: boolean }>(`/channels/${id}`, { method: "DELETE" })
const testToken = (bot_token: string) => apiFetch<TestResult>("/channels/test", { method: "POST", body: JSON.stringify({ bot_token }) })

export function useChannels() {
  return useQuery({ queryKey: ["channels"], queryFn: fetchChannels })
}

export function useChannel(id: string) {
  return useQuery({ queryKey: ["channels", id], queryFn: () => fetchChannel(id), enabled: !!id })
}

export function useCreateChannel() {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: createChannel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["channels"] }); toast("success", "Channel created") },
    onError: (e: Error) => toast("error", e.message),
  })
}

export function useDeleteChannel() {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["channels"] }); toast("success", "Channel deleted") },
    onError: (e: Error) => toast("error", e.message),
  })
}

export function useTestChannelToken() {
  return useMutation({
    mutationFn: testToken,
  })
}

export async function testChannelToken(bot_token: string): Promise<TestResult> {
  return testToken(bot_token)
}
