import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function RouterNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 border-amber-500 bg-white dark:bg-slate-900 shadow-md min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Router</div>
      <div className="font-medium text-sm mt-1">{data.label}</div>
      {data.conditions?.length > 0 && (
        <div className="text-[10px] text-gray-500 mt-1">
          Routes: {data.conditions.join(", ")}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  )
}

export default memo(RouterNode)
