/** Agents screen — workers with roles, models, tools, memory. */

import { useEffect } from "react"
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from "../api/agents"
import type { AgentFormData } from "../api/agents"
import { useAgentStore } from "../store/agentStore"
import AgentCard from "../components/AgentBuilder/AgentCard"
import AgentForm from "../components/AgentBuilder/AgentForm"
import { Button, Empty, SkeletonCard } from "../components/ui"
import { Bot } from "lucide-react"

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents()
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()
  const { isFormOpen, editingAgent, openForm, closeForm } = useAgentStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openForm() }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [openForm])

  const handleSave = (data: AgentFormData) => {
    if (editingAgent) updateAgent.mutate({ id: editingAgent.id, data })
    else createAgent.mutate(data)
    closeForm()
  }

  const handleDelete = (id: string) => { if (confirm("Delete this agent?")) deleteAgent.mutate(id) }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🤖 Agents</h1>
          <p className="text-sm text-muted mt-1">The workers in your workflows. Each has a role, model, and tools.</p>
        </div>
        <Button onClick={() => openForm()}>+ New Agent</Button>
      </div>

      {isFormOpen && (
        <div className="mb-6">
          <AgentForm initial={editingAgent?.data} onSave={handleSave} onCancel={closeForm} />
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && agents?.length === 0 && (
        <Empty icon={<Bot className="w-12 h-12" />} title="No agents yet" description="Create your first agent. Agents are LLM-powered workers with tools and guardrails." action={{ label: "Create Agent", onClick: () => openForm() }} />
      )}

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
