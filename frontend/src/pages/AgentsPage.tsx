import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from "../api/agents"
import type { AgentFormData } from "../api/agents"
import { useAgentStore } from "../store/agentStore"
import AgentCard from "../components/AgentBuilder/AgentCard"
import AgentForm from "../components/AgentBuilder/AgentForm"

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents()
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()
  const { isFormOpen, editingAgent, openForm, closeForm } = useAgentStore()

  const handleSave = (data: AgentFormData) => {
    if (editingAgent) {
      updateAgent.mutate({ id: editingAgent.id, data })
    } else {
      createAgent.mutate(data)
    }
    closeForm()
  }

  const handleDelete = (id: string) => {
    if (confirm("Delete this agent?")) deleteAgent.mutate(id)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <button
          onClick={() => openForm()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + New Agent
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-6">
          <AgentForm
            initial={editingAgent?.data}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </div>
      )}

      {isLoading && <p className="text-gray-500">Loading...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents?.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEdit={() => openForm({ id: agent.id, data: { ...agent, guardrails: { blocked_topics: agent.guardrails?.blocked_topics ?? [], max_tokens: agent.guardrails?.max_tokens ?? 4096 } } })}
            onDelete={() => handleDelete(agent.id)}
          />
        ))}
      </div>
    </div>
  )
}
