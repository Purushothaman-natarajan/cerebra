/** Templates page — browse pre-built workflows with import history and error handling. */

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTemplates } from "@/api/templates"
import type { Template } from "@/api/templates"
import { useCreateWorkflow } from "@/api/workflows"
import { Button, Card, Badge, Dialog, SkeletonCard } from "@/components/ui"
import { FileText, ArrowRight, Clock, AlertCircle } from "lucide-react"

export default function TemplatesPage() {
  const { data: templates, isLoading, isError } = useTemplates()
  const createWorkflow = useCreateWorkflow()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<Template | null>(null)
  const [importedHistory, setImportedHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("cerebra-template-history") || "[]") } catch { return [] }
  })

  const handleImport = (tmpl: Template) => {
    createWorkflow.mutate(
      { name: tmpl.name, nodes: tmpl.nodes, edges: tmpl.edges, trigger: tmpl.trigger },
      { onSuccess: (data) => {
        const updated = [tmpl.name, ...importedHistory.filter((h) => h !== tmpl.name)].slice(0, 10)
        localStorage.setItem("cerebra-template-history", JSON.stringify(updated))
        setImportedHistory(updated)
        setSelected(null)
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
              const tmpl = templates?.find((t) => t.name === name)
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
          {templates?.map((tmpl) => (
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
      <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected?.name} className="max-w-lg">
        {selected && (
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
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={() => handleImport(selected)} loading={createWorkflow.isPending}>Use Template</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
