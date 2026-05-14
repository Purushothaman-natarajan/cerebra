/** Custom ReactFlow agent node — theme-aware accent colors. */

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function AgentNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 bg-card shadow-md min-w-[160px]" style={{ borderColor: "var(--accent)" }}>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5" style={{ background: "var(--accent)" }} />
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--accent)" }}>Agent</div>
      <div className="font-medium text-sm text-foreground">{data.label}</div>
      {data.tools?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.tools.map((t: string) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{t}</span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5" style={{ background: "var(--accent)" }} />
    </div>
  )
}

export default memo(AgentNode)
