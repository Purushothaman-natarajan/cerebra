/** Custom ReactFlow router node — amber accent for conditional branching. */

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function RouterNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 bg-card shadow-md min-w-[160px]" style={{ borderColor: "var(--accent)", opacity: 0.85 }}>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5" style={{ background: "var(--accent)" }} />
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--accent)" }}>Router</div>
      <div className="font-medium text-sm text-foreground">{data.label}</div>
      {data.conditions?.length > 0 && (
        <div className="text-[10px] text-muted mt-1">Routes: {data.conditions.join(", ")}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5" style={{ background: "var(--accent)" }} />
    </div>
  )
}

export default memo(RouterNode)
