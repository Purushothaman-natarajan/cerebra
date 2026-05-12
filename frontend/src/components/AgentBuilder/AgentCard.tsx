import type { Agent } from "../../api/agents"

interface Props {
  agent: Agent
  onEdit: () => void
  onDelete: () => void
}

export default function AgentCard({ agent, onEdit, onDelete }: Props) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{agent.name}</h3>
          <p className="text-xs text-gray-500">{agent.role}</p>
        </div>
        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">{agent.model}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{agent.system_prompt}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {agent.tools.map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{t}</span>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2 text-xs text-gray-500">
          <span>Iterations: {agent.max_iterations}</span>
          {agent.memory_enabled && <span className="text-green-600">Memory ON</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-xs px-3 py-1 border rounded hover:bg-gray-50">Edit</button>
          <button onClick={onDelete} className="text-xs px-3 py-1 border rounded text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </div>
  )
}
