/** Workflows screen — canvas with template wizard, run config, workflow list cards. */

import { useState, useCallback } from "react"
import type { Node, Edge } from "reactflow"
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from "@/api/workflows"
import { useTemplates } from "@/api/templates"
import type { Template } from "@/api/templates"
import { useAgents } from "@/api/agents"
import { useTriggerRun } from "@/api/runs"
import Canvas from "@/components/WorkflowCanvas/Canvas"
import { Button, Card, Badge, Dialog, Textarea, Select, Input } from "@/components/ui"
import { GitBranch, Play, Copy, Trash2, FileText } from "lucide-react"

export default function WorkflowsPage() {
  const { data: workflows, isLoading } = useWorkflows()
  const { data: templates } = useTemplates()
  const { data: agents } = useAgents()
  const createWorkflow = useCreateWorkflow()
  const updateWorkflow = useUpdateWorkflow()
  const deleteWorkflow = useDeleteWorkflow()
  const triggerRun = useTriggerRun()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [canvasNodes, setCanvasNodes] = useState<Node[]>([])
  const [canvasEdges, setCanvasEdges] = useState<Edge[]>([])
  const [name, setName] = useState("")
  const [showTemplates, setShowTemplates] = useState(false)
  const [showRunConfig, setShowRunConfig] = useState(false)
  const [templateStep, setTemplateStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [runInput, setRunInput] = useState("")

  const selectWorkflow = useCallback((id: string) => {
    setSelectedId(id)
    const wf = workflows?.find((w) => w.id === id)
    if (wf) {
      setName(wf.name)
      setCanvasNodes(wf.nodes.map((n, i) => ({ id: n.id, type: n.type, position: { x: 100 + i * 200, y: 100 }, data: { label: n.id, ...n.config } })) as Node[])
      setCanvasEdges(wf.edges.map((e) => ({ id: `e-${e.source}-${e.target}`, source: e.source, target: e.target, type: "smoothstep", data: { condition: e.condition } })))
    }
  }, [workflows])

  const handleSave = useCallback(() => {
    if (!selectedId) return
    const nodes = canvasNodes.map((n) => ({ id: n.id, type: n.type as "agent" | "router", config: n.data }))
    const edges = canvasEdges.map((e) => ({ source: e.source, target: e.target, condition: e.data?.condition ?? null }))
    updateWorkflow.mutate({ id: selectedId, data: { name, nodes, edges } })
  }, [selectedId, canvasNodes, canvasEdges, name, updateWorkflow])

  const handleNew = () => createWorkflow.mutate(
    { name: "New Workflow", nodes: [], edges: [], trigger: { type: "manual", config: {} } },
    { onSuccess: (data) => selectWorkflow(data.id) }
  )

  const handleDuplicate = (id: string) => {
    const wf = workflows?.find((w) => w.id === id)
    if (wf) createWorkflow.mutate({ ...wf, name: `${wf.name} (copy)` }, { onSuccess: (data) => selectWorkflow(data.id) })
  }

  const handleRunNow = (id: string) => { setSelectedId(id); setShowRunConfig(true) }

  const handleImportTemplate = () => {
    if (!selectedTemplate) return
    createWorkflow.mutate(
      { name: selectedTemplate.name, nodes: selectedTemplate.nodes, edges: selectedTemplate.edges, trigger: selectedTemplate.trigger },
      { onSuccess: (data) => { setShowTemplates(false); setSelectedTemplate(null); selectWorkflow(data.id) } }
    )
  }

  const triggerTypes = ["manual", "telegram", "schedule"]

  return (
    <div className="flex h-full">
      {/* Workflow list sidebar */}
      <div className="w-60 border-r border-border overflow-y-auto bg-card shrink-0 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-sm">Workflows</h2>
            <Button size="sm" onClick={handleNew}>+ New</Button>
          </div>
          <Button variant="secondary" size="sm" className="w-full gap-2" onClick={() => setShowTemplates(true)}>
            <FileText className="w-3.5 h-3.5" /> From Template
          </Button>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {isLoading && <p className="text-xs text-muted text-center py-4">Loading...</p>}
          {workflows?.map((wf) => (
            <Card key={wf.id} hover className={`p-3 cursor-pointer ${selectedId === wf.id ? "ring-2 ring-accent" : ""}`} onClick={() => selectWorkflow(wf.id)}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-foreground truncate">{wf.name}</span>
                <Badge variant={wf.trigger?.type === "schedule" ? "warning" : "default"} className="shrink-0 ml-1">{wf.trigger?.type || "manual"}</Badge>
              </div>
              <p className="text-[10px] text-muted mb-2">{wf.nodes.length} agents · {wf.edges.length} connections</p>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleRunNow(wf.id) }} className="p-1 rounded hover:bg-accent-soft" title="Run Now"><Play className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDuplicate(wf.id) }} className="p-1 rounded hover:bg-accent-soft" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteWorkflow.mutate(wf.id) }} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </Card>
          ))}
          {workflows?.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <GitBranch className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
              <p className="text-xs text-muted mb-3">No workflows yet</p>
              <Button size="sm" onClick={handleNew}>Create One</Button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedId ? (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-border bg-card shrink-0">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
              <Button size="sm" variant="secondary" onClick={handleSave}>Save</Button>
              <Button size="sm" onClick={() => handleRunNow(selectedId)}><Play className="w-3.5 h-3.5 mr-1" /> Run</Button>
            </div>
            <div className="flex-1">
              <Canvas initialNodes={canvasNodes} initialEdges={canvasEdges} onCanvasChange={(nodes, edges) => { setCanvasNodes(nodes); setCanvasEdges(edges) }} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <GitBranch className="w-12 h-12 text-muted mx-auto mb-4 opacity-40" />
              <p className="text-muted mb-4">Select a workflow or create one</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleNew}>+ Blank Workflow</Button>
                <Button variant="secondary" onClick={() => setShowTemplates(true)}><FileText className="w-4 h-4" /> From Template</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template picker dialog */}
      <Dialog open={showTemplates && !selectedTemplate} onClose={() => setShowTemplates(false)} title="Choose a Template" className="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {templates?.map((tmpl) => (
            <Card key={tmpl.name} hover className="cursor-pointer" onClick={() => setSelectedTemplate(tmpl)}>
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-accent-soft"><FileText className="w-4 h-4" style={{ color: "var(--accent)" }} /></div>
                <Badge variant="info" className="text-[10px]">{tmpl.trigger_type}</Badge>
              </div>
              <h4 className="font-medium text-foreground text-sm mb-1">{tmpl.name}</h4>
              <p className="text-xs text-muted mb-2">{tmpl.description}</p>
              <div className="flex gap-3 text-[10px] text-muted">
                <span>{tmpl.node_count} agents</span>
                <span>{tmpl.edge_count} connections</span>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setShowTemplates(false)}>Cancel</Button>
        </div>
      </Dialog>

      {/* Template 3-step wizard */}
      <Dialog open={showTemplates && !!selectedTemplate} onClose={() => { setShowTemplates(false); setSelectedTemplate(null) }} title={`Use: ${selectedTemplate?.name}`} className="max-w-xl">
        {templateStep === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Assign agents or create new ones with pre-filled defaults.</p>
            {selectedTemplate?.nodes.filter((n) => n.type === "agent").map((n) => (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground w-32 truncate">{n.id}</span>
                <Select options={[{ value: "__new__", label: "Create new with defaults" }, ...(agents?.map((a) => ({ value: a.id, label: a.name })) ?? [])]} value="__new__" className="flex-1" />
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>Back</Button>
              <Button onClick={() => setTemplateStep(1)}>Next →</Button>
            </div>
          </div>
        )}
        {templateStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Choose models for each agent.</p>
            {selectedTemplate?.nodes.filter((n) => n.type === "agent").map((n) => (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground w-32 truncate">{n.id}</span>
                <Input defaultValue={n.config?.model as string || "gemini-2.0-flash"} className="flex-1" />
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setTemplateStep(0)}>Back</Button>
              <Button onClick={() => setTemplateStep(2)}>Next →</Button>
            </div>
          </div>
        )}
        {templateStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">How should this workflow start?</p>
            <div className="space-y-2">
              {triggerTypes.map((t) => (
                <label key={t} className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-accent-soft">
                  <input type="radio" name="trigger" defaultChecked={t === "manual"} className="accent-accent" />
                  <span className="text-sm text-foreground capitalize">{t === "manual" ? "Manual (run from UI)" : t === "telegram" ? "Telegram message" : "Schedule"}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setTemplateStep(1)}>Back</Button>
              <Button onClick={handleImportTemplate}>Finish & Open Canvas →</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Run Configuration */}
      <Dialog open={showRunConfig} onClose={() => setShowRunConfig(false)} title="Run Workflow" className="max-w-lg">
        <div className="space-y-4">
          <Textarea label="Input" value={runInput} onChange={(e) => setRunInput(e.target.value)} rows={3} placeholder="Enter your input message..." />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowRunConfig(false)}>Cancel</Button>
            <Button onClick={() => {
              if (selectedId) { triggerRun.mutate({ workflow_id: selectedId, input: runInput }); setShowRunConfig(false) }
            }}><Play className="w-4 h-4 mr-1" /> Run Workflow</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
