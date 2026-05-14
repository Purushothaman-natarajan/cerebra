/** Workflows screen — canvas with template wizard, run config, workflow list cards. */

import { useState, useCallback } from "react"
import type { Node, Edge } from "reactflow"
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from "../api/workflows"
import { useTemplates } from "../api/templates"
import type { Template } from "../api/templates"
import { useAgents } from "../api/agents"
import { useTriggerRun } from "../api/runs"
import Canvas from "../components/WorkflowCanvas/Canvas"
import { Button, Card, Badge, Dialog, Textarea, Select, Empty } from "../components/ui"
import { GitBranch, Play, Copy, Trash2 } from "lucide-react"

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

  const handleRunNow = (id: string) => {
    setSelectedId(id)
    setShowRunConfig(true)
  }

  const handleTemplateClick = (tmpl: Template) => {
    setSelectedTemplate(tmpl)
    setTemplateStep(0)
    setShowTemplates(true)
  }

  const handleImportTemplate = () => {
    if (!selectedTemplate) return
    createWorkflow.mutate(
      { name: selectedTemplate.name, nodes: selectedTemplate.nodes, edges: selectedTemplate.edges, trigger: selectedTemplate.trigger },
      { onSuccess: (data) => { setShowTemplates(false); setSelectedTemplate(null); selectWorkflow(data.id) } }
    )
  }

  return (
    <div className="flex h-screen">
      {/* Workflow list sidebar */}
      <div className="w-72 border-r border-border p-4 overflow-y-auto bg-card shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-foreground text-sm">Workflows</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowTemplates(true)}>📋 Templates</Button>
            <Button size="sm" onClick={handleNew}>+ New</Button>
          </div>
        </div>

        {isLoading && <p className="text-xs text-muted">Loading...</p>}

        <div className="space-y-2">
          {workflows?.map((wf) => (
            <Card key={wf.id} hover className={`p-3 cursor-pointer ${selectedId === wf.id ? "ring-2 ring-accent" : ""}`} onClick={() => selectWorkflow(wf.id)}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-foreground">{wf.name}</span>
                <Badge variant={wf.trigger?.type === "schedule" ? "warning" : "default"}>{wf.trigger?.type || "manual"}</Badge>
              </div>
              <p className="text-[10px] text-muted mb-2">{wf.nodes.length} agents · {wf.edges.length} connections</p>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleRunNow(wf.id) }} className="p-1 rounded hover:bg-accent-soft transition-colors" title="Run Now"><Play className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDuplicate(wf.id) }} className="p-1 rounded hover:bg-accent-soft transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteWorkflow.mutate(wf.id) }} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-rose-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </Card>
          ))}
          {workflows?.length === 0 && !isLoading && (
            <Empty title="No workflows" description="Create one or import a template." action={{ label: "Use Template", onClick: () => setShowTemplates(true) }} />
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col">
        {selectedId ? (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
              <input className="flex-1 rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm text-foreground" value={name} onChange={(e) => setName(e.target.value)} />
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
                <Button variant="secondary" onClick={() => setShowTemplates(true)}>📋 From Template</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template picker dialog */}
      <Dialog open={showTemplates && !selectedTemplate} onClose={() => setShowTemplates(false)} title="Choose a Template" className="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {templates?.map((tmpl) => (
            <Card key={tmpl.name} hover className="cursor-pointer" onClick={() => handleTemplateClick(tmpl)}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-foreground text-sm">{tmpl.name}</h4>
                <Badge variant="info" className="text-[10px]">{tmpl.trigger_type}</Badge>
              </div>
              <p className="text-xs text-muted mb-2">{tmpl.description}</p>
              <div className="flex gap-3 text-[10px] text-muted">
                <span>{tmpl.node_count} agents</span>
                <span>{tmpl.edge_count} connections</span>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          <Button variant="ghost" onClick={() => setShowTemplates(false)}>Cancel</Button>
        </div>
      </Dialog>

      {/* Template 3-step wizard */}
      <Dialog open={showTemplates && !!selectedTemplate} onClose={() => { setShowTemplates(false); setSelectedTemplate(null) }} title={`Use Template: ${selectedTemplate?.name}`} className="max-w-xl">
        {templateStep === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">This template creates a {selectedTemplate?.node_count}-agent workflow. Assign existing agents or create new ones with pre-filled defaults.</p>
            {selectedTemplate?.nodes.filter((n) => n.type === "agent").map((n) => (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground w-32">{n.id}</span>
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
                <span className="text-sm font-medium text-foreground w-32">{n.id}</span>
                <input className="flex-1 rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm" defaultValue={n.config?.model as string || "gemini-2.0-flash"} />
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
              {["manual", "telegram", "schedule"].map((t) => (
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
              if (selectedId) {
                triggerRun.mutate({ workflow_id: selectedId, input: runInput })
                setShowRunConfig(false)
              }
            }}><Play className="w-4 h-4 mr-1" /> Run Workflow</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
