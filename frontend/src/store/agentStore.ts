import { create } from "zustand"
import type { AgentFormData } from "@/api/agents"

interface AgentStore {
  isFormOpen: boolean
  editingAgent: { id: string; data: AgentFormData } | null
  openForm: (agent?: { id: string; data: AgentFormData }) => void
  closeForm: () => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  isFormOpen: false,
  editingAgent: null,
  openForm: (agent) => set({ isFormOpen: true, editingAgent: agent ?? null }),
  closeForm: () => set({ isFormOpen: false, editingAgent: null }),
}))
