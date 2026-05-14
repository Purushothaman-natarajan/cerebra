/** Agent card — emoji avatar, role, prompt preview, model badge, memory indicator, edit/delete. */

import type { Agent } from "@/api/agents"
import { Pencil, Trash2, MemoryStick as Memory } from "lucide-react"
import { Badge } from "@/components/ui"

interface Props {
  agent: Agent
  onEdit: () => void
  onDelete: () => void
}

const roleEmojis: Record<string, string> = {
  research: "🔍", writer: "✍️", review: "✅", support: "🎫",
  billing: "💰", coding: "💻", default: "🤖",
}

export default function AgentCard({ agent, onEdit, onDelete }: Props) {
  const emoji = Object.entries(roleEmojis).find(([key]) => agent.role.toLowerCase().includes(key))?.[1] || roleEmojis.default

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-strong transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-lg" style={{ color: "var(--accent)" }}>
            {emoji}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <p className="text-xs text-muted">{agent.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-[10px]">{agent.model}</Badge>
          {agent.memory_enabled && <Memory className="w-3.5 h-3.5 text-emerald-500" aria-label="Memory enabled" />}
        </div>
      </div>
      <p className="text-sm text-muted line-clamp-2 mb-3 italic">"{agent.system_prompt.slice(0, 120)}{agent.system_prompt.length > 120 ? "..." : ""}"</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {agent.tools.map((t) => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft" style={{ color: "var(--accent)" }}>{t}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-[10px] text-muted">Iterations: {agent.max_iterations}</span>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-accent-soft transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  )
}
