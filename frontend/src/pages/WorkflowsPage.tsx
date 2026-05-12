import { useState, useCallback } from "react"
import type { Node, Edge } from "reactflow"
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from "../api/workflows"
import { useTemplates } from "../api/templates"
import type { Template } from "../api/templates"
import Canvas from "../components/WorkflowCanvas/Canvas"

export default function WorkflowsPage() {
  const { data: workflows, isLoading } = useWorkflows()
  const { data: templates } = useTemplates()
  const createWorkflow = useCreateWorkflow()
  const updateWorkflow = useUpdateWorkflow()
  const deleteWorkflow = useDeleteWorkflow()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [canvasNodes, setCanvasNodes] = useState<Node[]>([])
  const [canvasEdges, setCanvasEdges] = useState<Edge[]>([])
  const [name, setName] = useState("")
  const [showTemplates, setShowTemplates] = useState(false)

  const selectWorkflow = useCallback((id: string) => {
    setSelectedId(id)
    const wf = workflows?.find((w) => w.id === id)
    if (wf) {
      setName(wf.name)
      setCanvasNodes(
        wf.nodes.map((n, i) => ({
          id: n.id,
          type: n.type,
          position: { x: 100 + i * 200, y: 100 },
          data: { label: n.id, ...n.config },
        })) as Node[]
      )
      setCanvasEdges(
        wf.edges.map((e) => ({
          id: `e-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          data: { condition: e.condition },
        }))
      )
    }
  }, [workflows])

  const handleSave = useCallback(() => {
    if (!selectedId) return
    const nodes = canvasNodes.map((n) => ({
      id: n.id,
      type: n.type as "agent" | "router",
      config: n.data,
    }))
    const edges = canvasEdges.map((e) => ({
      source: e.source,
      target: e.target,
      condition: e.data?.condition ?? null,
    }))
    updateWorkflow.mutate({ id: selectedId, data: { name, nodes, edges } })
  }, [selectedId, canvasNodes, canvasEdges, name, updateWorkflow])

  const handleNew = useCallback(() => {
    const newWf = { name: "New Workflow", nodes: [], edges: [], trigger: { type: "manual", config: {} } }
    createWorkflow.mutate(newWf, {
      onSuccess: (data) => selectWorkflow(data.id),
    })
  }, [createWorkflow, selectWorkflow])

  const handleImportTemplate = useCallback((tmpl: Template) => {
    createWorkflow.mutate(
      { name: tmpl.name, nodes: tmpl.nodes, edges: tmpl.edges, trigger: tmpl.trigger },
      { onSuccess: (data) => { setShowTemplates(false); selectWorkflow(data.id) } }
    )
  }, [createWorkflow, selectWorkflow])

  const handleDelete = useCallback(() => {
    if (!selectedId) return
    if (confirm("Delete this workflow?")) {
      deleteWorkflow.mutate(selectedId)
      setSelectedId(null)
      setCanvasNodes([])
      setCanvasEdges([])
    }
  }, [selectedId, deleteWorkflow])

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-sm">Workflows</h2>
          <div className="flex gap-1">
            <button onClick={() => setShowTemplates(true)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
              Templates
            </button>
            <button onClick={handleNew} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
              + New
            </button>
          </div>
        </div>
        {isLoading && <p className="text-xs text-gray-500">Loading...</p>}
        {workflows?.map((wf) => (
          <div
            key={wf.id}
            onClick={() => selectWorkflow(wf.id)}
            className={`p-2 rounded cursor-pointer text-sm mb-1 ${
              selectedId === wf.id ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {wf.name}
            <span className="text-[10px] text-gray-500 ml-2">{wf.nodes.length} nodes</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {selectedId ? (
          <>
            <div className="flex items-center gap-3 p-3 border-b">
              <input
                className="border rounded px-3 py-1 text-sm flex-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button onClick={handleSave} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                Save
              </button>
              <button onClick={handleDelete} className="px-3 py-1 text-sm border rounded text-red-600">
                Delete
              </button>
            </div>
            <div className="flex-1">
              <Canvas
                initialNodes={canvasNodes}
                initialEdges={canvasEdges}
                onCanvasChange={(nodes, edges) => {
                  setCanvasNodes(nodes)
                  setCanvasEdges(edges)
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="mb-4">Select a workflow or create one</p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  + Blank Workflow
                </button>
                <button onClick={() => setShowTemplates(true)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  From Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTemplates(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Import Template</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {templates?.length === 0 && <p className="text-sm text-gray-500">No templates found</p>}
              {templates?.map((tmpl) => (
                <div
                  key={tmpl.name}
                  onClick={() => handleImportTemplate(tmpl)}
                  className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">{tmpl.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {tmpl.trigger_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{tmpl.description}</p>
                  <div className="flex gap-3 text-[10px] text-gray-400">
                    <span>{tmpl.node_count} nodes</span>
                    <span>{tmpl.edge_count} edges</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className="mt-4 w-full px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
