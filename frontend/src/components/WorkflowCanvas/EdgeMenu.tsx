/** Edge condition editor popup — themed, uses Button + Input components. */

import { useState } from "react"
import { Button } from "@/components/ui"

interface Props {
  condition: string | null
  onSave: (condition: string | null) => void
  onDelete: () => void
}

export default function EdgeMenu({ condition, onSave, onDelete }: Props) {
  const [value, setValue] = useState(condition ?? "")

  return (
    <div className="p-3 bg-card border border-border rounded-xl shadow-strong min-w-[220px]">
      <label className="block text-xs font-medium text-foreground mb-1.5">Condition</label>
      <input
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder='e.g., state["score"] >= 7'
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <p className="text-[10px] text-muted mb-2">Variables: state.output, state.score</p>
      <div className="flex gap-1.5">
        <Button size="sm" onClick={() => onSave(value || null)}>Save</Button>
        <Button variant="secondary" size="sm" onClick={() => onSave(null)}>Clear</Button>
        <button onClick={onDelete} className="px-2 py-1 text-xs rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">Delete</button>
      </div>
    </div>
  )
}
