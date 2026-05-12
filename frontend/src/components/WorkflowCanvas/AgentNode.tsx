import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function AgentNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 border-blue-500 bg-white dark:bg-slate-900 shadow-md min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Agent</div>
      <div className="font-medium text-sm mt-1">{data.label}</div>
      {data.tools?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.tools.map((t: string) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900 rounded">{t}</span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  )
}

export default memo(AgentNode)
