/** Output node — returns result or sends to destination. */

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { LogOut } from "lucide-react"

function OutputNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 bg-card shadow-md min-w-[160px]" style={{ borderColor: "#10b981" }}>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5" style={{ background: "#10b981" }} />
      <div className="flex items-center gap-1.5 mb-0.5">
        <LogOut className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Output</span>
      </div>
      <div className="font-medium text-sm text-foreground">{data.label || "Output"}</div>
      <p className="text-[10px] text-muted mt-1 capitalize">{data.output_type || "return"} result</p>
    </div>
  )
}

export default memo(OutputNode)
