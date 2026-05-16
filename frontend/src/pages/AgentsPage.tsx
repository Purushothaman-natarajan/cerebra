/** Agents page — create/edit with form, loading/error/empty states + template presets. */

import { useEffect, useRef, useState } from "react"
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent, useAgentTemplates, exportAllAgents, useImportAgents } from "@/api/agents"
import type { AgentFormData } from "@/api/agents"
import { useAgentStore } from "@/store/agentStore"
import AgentCard from "@/components/AgentBuilder/AgentCard"
import AgentForm from "@/components/AgentBuilder/AgentForm"
import AgentTestDialog from "@/components/AgentBuilder/AgentTestDialog"
import { Badge, Button, Card, Empty, SkeletonCard } from "@/components/ui"
import { Bot, Plus, LayoutTemplate, Download, Upload } from "lucide-react"

export default function AgentsPage() {
  const { data: agents, isLoading, isError } = useAgents()
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()
  const { data: templates } = useAgentTemplates()
  const importAgents = useImportAgents()
  const { isFormOpen, editingAgent, openForm, closeForm } = useAgentStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [testAgentId, setTestAgentId] = useState<string | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      importAgents.mutate(Array.isArray(data) ? data : [data])
    } catch { alert("Invalid JSON file") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); openForm() }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [openForm])

  const handleSave = (data: AgentFormData) => {
    const isDefault = editingAgent ? (editingAgent.data as any).is_default : false
    if (editingAgent && editingAgent.id && !isDefault) {
      updateAgent.mutate({ id: editingAgent.id, data })
    } else {
      createAgent.mutate(data)
    }
    closeForm()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted mt-0.5">The workers in your workflows. Each has a role, model, and tools.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}><Upload className="w-3.5 h-3.5" /> Import</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportAllAgents}><Download className="w-3.5 h-3.5" /> Export All</Button>
          <Button onClick={() => openForm()} className="gap-2"><Plus className="w-4 h-4" /> New Agent</Button>
        </div>
      </div>

      {/* Agent form */}
      {isFormOpen && (
        <div className="animate-in">
          <AgentForm initial={editingAgent?.data} onSave={handleSave} onCancel={closeForm} />
        </div>
      )}

      {/* Agent Templates */}
      {templates && templates.length > 0 && !isFormOpen && (
        <div>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <LayoutTemplate className="w-3.5 h-3.5" /> Agent Templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {templates.map((tmpl) => (
              <Card key={tmpl.id} hover className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-foreground text-sm truncate">{tmpl.name}</span>
                      <Badge variant="info" className="shrink-0">template</Badge>
                    </div>
                    <p className="text-xs text-muted line-clamp-2">{tmpl.role}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tmpl.tools.slice(0, 4).map((tool) => (
                        <span key={tool} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-muted">{tool}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="w-full mt-3" onClick={() => openForm({ id: "", data: { name: tmpl.name, role: tmpl.role, system_prompt: tmpl.system_prompt, model: "", tools: tmpl.tools, memory_enabled: tmpl.memory_enabled, max_iterations: tmpl.max_iterations, guardrails: { blocked_topics: tmpl.guardrails?.blocked_topics ?? [], max_tokens: tmpl.guardrails?.max_tokens ?? 4096 } } })}>
                  Use Template
                </Button>
              </Card>
            ))}
          </div>
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
        {agents?.map((agent) => {
          const agentJson = {
            name: agent.name, role: agent.role, system_prompt: agent.system_prompt,
            model: agent.model, tools: agent.tools, memory_enabled: agent.memory_enabled,
            max_iterations: agent.max_iterations, guardrails: agent.guardrails,
          }
          return (
            <AgentCard key={agent.id} agent={agent}
              onEdit={() => openForm({ id: agent.id, data: { ...agent, guardrails: { blocked_topics: agent.guardrails?.blocked_topics ?? [], max_tokens: agent.guardrails?.max_tokens ?? 4096 } } })}
              onDelete={() => { if (confirm("Delete this agent?")) deleteAgent.mutate(agent.id) }}
              onDownload={() => {
                const blob = new Blob([JSON.stringify(agentJson, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url; a.download = `${agent.name.replace(/\s+/g, "_")}.json`
                a.click(); URL.revokeObjectURL(url)
              }}
              onTest={() => setTestAgentId(agent.id)}
            />
          )
        })}
      </div>

      {/* Agent Test Dialog */}
      <AgentTestDialog
        agentName={agents?.find((a) => a.id === testAgentId)?.name ?? ""}
        agentId={testAgentId ?? ""}
        open={!!testAgentId}
        onClose={() => setTestAgentId(null)}
      />
    </div>
  )
}
