import { create } from "zustand"

interface RunStore {
  selectedRunId: string | null
  selectRun: (id: string | null) => void
}

export const useRunStore = create<RunStore>((set) => ({
  selectedRunId: null,
  selectRun: (id) => set({ selectedRunId: id }),
}))
