/** Templates page — browse pre-built workflows with import history and error handling. */

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTemplates } from "@/api/templates"
import type { Template } from "@/api/templates"
import { useCreateWorkflow } from "@/api/workflows"
import { useAvailableModels } from "@/api/providers"
import { Button, Card, Badge, Dialog, Select, SkeletonCard } from "@/components/ui"
import { FileText, ArrowRight, Clock, AlertCircle } from "lucide-react"

export default function TemplatesPage() {
  const { data: templates, isLoading, isError } = useTemplates()
  const { data: availableModels, isLoading: isLoadingModels } = useAvailableModels()
  const createWorkflow = useCreateWorkflow()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<Template | null>(null)
  const [noProviderError, setNoProviderError] = useState(false)
  const [importedHistory, setImportedHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("cerebra-template-history") || "[]") } catch { return [] }
  })
  const [nodeModels, setNodeModels] = useState<Record<string, { model: string; provider_id: string }>>({})

  useEffect(() => {
    if (!selected?.nodes || !availableModels?.length) return
    const defaults: Record<string, { model: string; provider_id: string }> = {}
    for (const node of selected.nodes) {
      if (node.type === "agent") {
        defaults[node.id] = { model: availableModels[0].model, provider_id: availableModels[0].provider_id }
      }
    }
    setNodeModels(defaults)
  }, [selected, availableModels])

  const handleImport = (tmpl: Template) => {
    setNoProviderError(false)
    if (isLoadingModels) return
    if (!availableModels || availableModels.length === 0) {
      setNoProviderError(true)
      return
    }
    const nodes = tmpl.nodes.map((node) => {
      if (node.type !== "agent") return node
      const nm = nodeModels[node.id]
      return { ...node, config: { ...node.config, model: nm?.model ?? "", provider_id: nm?.provider_id ?? null } }
    })
    createWorkflow.mutate(
      { name: tmpl.name, nodes, edges: tmpl.edges, trigger: tmpl.trigger },
      { onSuccess: (data) => {
        const updated = [tmpl.name, ...importedHistory.filter((h) => h !== tmpl.name)].slice(0, 10)
        localStorage.setItem("cerebra-template-history", JSON.stringify(updated))
        setImportedHistory(updated)
        setSelected(null)
        setNoProviderError(false)
        navigate(`/workflows?id=${data.id}`)
      }}
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Templates</h1>
        <p className="text-sm text-muted mt-0.5">Pre-built workflow templates to get started quickly.</p>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Could not load templates. Make sure the backend is running on port 8000.</span>
          <button onClick={() => window.location.reload()} className="ml-auto px-3 py-1 rounded-lg bg-rose-200 dark:bg-rose-800 hover:bg-rose-300 dark:hover:bg-rose-700 transition-colors text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Recently used */}
      {!isError && importedHistory.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Recently Used
          </h2>
          <div className="flex flex-wrap gap-2">
            {importedHistory.map((name) => {
              const tmpl = templates?.find((t) => t.category === "workflows" && t.name === name)
              return tmpl ? (
                <button key={name} onClick={() => setSelected(tmpl)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-accent/50 hover:bg-accent-soft transition-all text-sm"
                >
                  <FileText className="w-4 h-4 text-muted" />
                  {name}
                </button>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Template grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.filter((t) => t.category === "workflows").map((tmpl) => (
            <Card key={tmpl.name} hover className="cursor-pointer p-5 flex flex-col" onClick={() => setSelected(tmpl)}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
                  <FileText className="w-5 h-5" />
                </div>
                <Badge variant="info" className="text-[10px]">{tmpl.trigger_type}</Badge>
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{tmpl.name}</h3>
              <p className="text-xs text-muted flex-1">{tmpl.description}</p>
              <div className="flex items-center gap-3 mt-4 text-[10px] text-muted">
                <span>{tmpl.node_count} agents</span>
                <span>{tmpl.edge_count} connections</span>
                {importedHistory.includes(tmpl.name) && <Badge variant="success">used</Badge>}
              </div>
            </Card>
          ))}
          {(!templates || templates.length === 0) && !isError && (
            <p className="text-sm text-muted col-span-full text-center py-12">No templates available.</p>
          )}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!selected} onClose={() => { setSelected(null); setNoProviderError(false) }} title={selected?.name} className="max-w-lg">
        {noProviderError ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground font-medium">No LLM providers configured</p>
            <p className="text-sm text-muted">LLM is the brain — without it, workflows can't run. Please add a provider first.</p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setSelected(null); setNoProviderError(false) }}>Cancel</Button>
              <Button onClick={() => navigate("/providers")}>Go to Providers</Button>
            </div>
          </div>
        ) : selected?.nodes ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">{selected.description}</p>
            <div className="flex gap-3 text-xs text-muted">
              <span>{selected.node_count} agents</span>
              <span>{selected.edge_count} connections</span>
              <Badge variant="info">{selected.trigger_type}</Badge>
            </div>
            <div className="border border-border rounded-xl p-3 bg-surface">
              <p className="text-xs font-medium text-foreground mb-2">Pipeline</p>
              <div className="flex items-center gap-1.5 text-xs text-muted flex-wrap">
                {selected.nodes.filter((n: { type: string }) => n.type === "agent").map((n: { id: string }, i: number, arr: { id: string }[]) => (
                  <span key={n.id} className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-accent-soft text-accent text-[10px]">{n.id}</span>
                    {i < arr.length - 1 && <ArrowRight className="w-3 h-3" />}
                  </span>
                ))}
              </div>
            </div>
            {selected.nodes.filter((n: { type: string }) => n.type === "agent").length > 0 && (
              <div className="space-y-3 border-t border-border pt-3">
                <p className="text-xs font-medium text-foreground">Agent Models</p>
                {selected.nodes.filter((n: { type: string }) => n.type === "agent").map((n: { id: string }) => (
                  <div key={n.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted w-24 truncate">{n.id}</span>
                    <Select
                      value={nodeModels[n.id]?.model ?? ""}
                      onChange={(e) => {
                        const m = e.target.value
                        const info = availableModels?.find((am: { model: string }) => am.model === m)
                        setNodeModels(prev => ({ ...prev, [n.id]: { model: m, provider_id: info?.provider_id ?? "" } }))
                      }}
                      options={availableModels?.map((m: { model: string; provider_name: string }) => ({ value: m.model, label: m.model, group: m.provider_name })) ?? []}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setSelected(null); setNoProviderError(false) }}>Cancel</Button>
              <Button onClick={() => handleImport(selected)} loading={createWorkflow.isPending || isLoadingModels} disabled={isLoadingModels}>Use Template</Button>
            </div>
          </div>
        ) : selected && (
          <p className="text-sm text-muted py-4">This template type is not available for preview.</p>
        )}
      </Dialog>
    </div>
  )
}
