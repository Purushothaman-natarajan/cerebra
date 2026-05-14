/** Human-in-the-loop node — pauses workflow for approval. */

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { UserCheck } from "lucide-react"

function HumanNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 bg-card shadow-md min-w-[160px]" style={{ borderColor: "#8b5cf6" }}>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5" style={{ background: "#8b5cf6" }} />
      <div className="flex items-center gap-1.5 mb-0.5">
        <UserCheck className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#8b5cf6" }}>Human Gate</span>
      </div>
      <div className="font-medium text-sm text-foreground">{data.label || "Approval Required"}</div>
      {data.approval_prompt && <p className="text-[10px] text-muted mt-1 truncate">{data.approval_prompt}</p>}
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5" style={{ background: "#8b5cf6" }} />
    </div>
  )
}

export default memo(HumanNode)
