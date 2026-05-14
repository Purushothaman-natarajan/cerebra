/** Note node — documentation-only on the canvas, no execution. */

import { memo } from "react"
import type { NodeProps } from "reactflow"
import { StickyNote } from "lucide-react"

function NoteNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl border border-dashed bg-card/50 shadow-sm min-w-[160px]" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <StickyNote className="w-3.5 h-3.5 text-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Note</span>
      </div>
      <div className="font-medium text-sm text-foreground">{data.label || "Note"}</div>
      {data.content && <p className="text-[10px] text-muted mt-1 line-clamp-2">{data.content}</p>}
    </div>
  )
}

export default memo(NoteNode)
