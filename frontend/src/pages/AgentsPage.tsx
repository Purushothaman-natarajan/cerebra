/** Agents page — create/edit with form, loading/error/empty states. Providers check at page level. */

import { useEffect } from "react"
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from "@/api/agents"
import type { AgentFormData } from "@/api/agents"
import { useProviders } from "@/api/providers"
import { useAgentStore } from "@/store/agentStore"
import AgentCard from "@/components/AgentBuilder/AgentCard"
import AgentForm from "@/components/AgentBuilder/AgentForm"
import { Button, Empty, SkeletonCard } from "@/components/ui"
import { Bot, Plus, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function AgentsPage() {
  const { data: agents, isLoading, isError } = useAgents()
  const { data: providers } = useProviders()
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()
  const { isFormOpen, editingAgent, openForm, closeForm } = useAgentStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); openForm() }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [openForm])

  const handleSave = (data: AgentFormData) => {
    if (editingAgent) updateAgent.mutate({ id: editingAgent.id, data })
    else createAgent.mutate(data)
    closeForm()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted mt-0.5">The workers in your workflows. Each has a role, model, and tools.</p>
        </div>
        <Button onClick={() => openForm()} className="shrink-0 gap-2"><Plus className="w-4 h-4" /> New Agent</Button>
      </div>

      {/* When form is open but no providers configured — show prompt instead of form */}
      {isFormOpen && (!providers || providers.length === 0) && (
        <div className="space-y-4 p-8 rounded-xl border border-border bg-card text-center animate-in">
          <Bot className="w-10 h-10 text-muted mx-auto opacity-40" />
          <p className="text-foreground font-medium">No LLM providers configured</p>
          <p className="text-sm text-muted max-w-sm mx-auto">Add a provider (OpenAI, Gemini, Ollama, etc.) before creating agents. API keys are encrypted at rest.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/providers")} className="gap-2">Add Provider <ArrowRight className="w-4 h-4" /></Button>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Render form only when providers exist */}
      {isFormOpen && providers && providers.length > 0 && (
        <div className="animate-in">
          <AgentForm initial={editingAgent?.data} onSave={handleSave} onCancel={closeForm} />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-400">
          Failed to load agents. Make sure the backend is running.
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && agents?.length === 0 && !isFormOpen && (
        <Empty icon={<Bot className="w-12 h-12" />} title="No agents yet" description="Create your first agent." action={{ label: "Create Agent", onClick: () => openForm() }} />
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents?.map((agent) => (
          <AgentCard key={agent.id} agent={agent}
            onEdit={() => openForm({ id: agent.id, data: { ...agent, guardrails: { blocked_topics: agent.guardrails?.blocked_topics ?? [], max_tokens: agent.guardrails?.max_tokens ?? 4096 } } })}
            onDelete={() => { if (confirm("Delete this agent?")) deleteAgent.mutate(agent.id) }}
          />
        ))}
      </div>
    </div>
  )
}
