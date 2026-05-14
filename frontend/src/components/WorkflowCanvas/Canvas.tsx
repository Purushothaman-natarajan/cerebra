/** ReactFlow workflow canvas with config panel, multiple node types, drag-and-drop. */

import { useCallback, useEffect, useRef, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
} from "reactflow"
import "reactflow/dist/style.css"
import AgentNode from "./AgentNode"
import RouterNode from "./RouterNode"
import HumanNode from "./HumanNode"
import OutputNode from "./OutputNode"
import NoteNode from "./NoteNode"
import EdgeMenu from "./EdgeMenu"
import NodeConfigPanel from "./NodeConfigPanel"

const nodeTypes = { agent: AgentNode, router: RouterNode, human: HumanNode, output: OutputNode, note: NoteNode }

interface Props {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onCanvasChange?: (nodes: Node[], edges: Edge[]) => void
}

let nodeId = 0
function newNodeId() { nodeId += 1; return `node_${nodeId}` }

const nodeDefaults: Record<string, Partial<Node>> = {
  agent: { data: { label: "New Agent", tools: [], system_prompt: "" } },
  router: { data: { label: "New Router", conditions: [] } },
  human: { data: { label: "Approval", approval_prompt: "", on_reject: "stop" } },
  output: { data: { label: "Output", output_type: "return" } },
  note: { data: { label: "Note", content: "" } },
}

function Flow({ initialNodes = [], initialEdges = [], onCanvasChange }: {
  initialNodes?: Node[]; initialEdges?: Edge[]; onCanvasChange?: (n: Node[], e: Edge[]) => void
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [edgeMenu, setEdgeMenu] = useState<{ edgeId: string; x: number; y: number; condition: string | null } | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const onCanvasChangeRef = useRef(onCanvasChange)
  onCanvasChangeRef.current = onCanvasChange
  const initialRef = useRef({ nodes: initialNodes, edges: initialEdges })

  // Sync canvas when selected workflow changes (switch between workflows) — only when reference changes
  useEffect(() => {
    if (initialRef.current.nodes !== initialNodes) {
      setNodes(initialNodes)
      initialRef.current.nodes = initialNodes
    }
    if (initialRef.current.edges !== initialEdges) {
      setEdges(initialEdges)
      initialRef.current.edges = initialEdges
    }
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Report changes to parent — stable ref avoids infinite loop from inline callbacks
  useEffect(() => { onCanvasChangeRef.current?.(nodes, edges) }, [nodes, edges])

  const handleNodesChange: OnNodesChange = useCallback((changes) => { onNodesChange(changes) }, [onNodesChange])
  const handleEdgesChange: OnEdgesChange = useCallback((changes) => { onEdgesChange(changes) }, [onEdgesChange])

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return
    const newEdge: Edge = { id: `e-${connection.source}-${connection.target}`, source: connection.source, target: connection.target, type: "smoothstep" }
    setEdges((eds) => addEdge(newEdge, eds))
  }, [setEdges])

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setEdgeMenu(null)
  }, [])

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setEdgeMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY, condition: edge.data?.condition ?? null })
  }, [])

  const onSaveEdgeCondition = useCallback((condition: string | null) => {
    if (!edgeMenu) return
    setEdges((eds) => eds.map((e) => e.id === edgeMenu.edgeId ? { ...e, data: { ...e.data, condition } } : e))
    setEdgeMenu(null)
  }, [edgeMenu, setEdges])

  const onDeleteEdge = useCallback(() => {
    if (!edgeMenu) return
    setEdges((eds) => eds.filter((e) => e.id !== edgeMenu.edgeId))
    setEdgeMenu(null)
  }, [edgeMenu, setEdges])

  const onUpdateNodeData = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    setSelectedNode((prev) => prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev)
  }, [setNodes])

  const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = "move" }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const type = event.dataTransfer.getData("application/reactflow") as keyof typeof nodeDefaults
    if (!type || !nodeDefaults[type]) return
    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    if (!bounds) return
    const defaults = nodeDefaults[type]
    const newNode: Node = {
      id: newNodeId(), type,
      position: { x: event.clientX - bounds.left - 80, y: event.clientY - bounds.top - 20 },
      data: defaults.data || {},
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const nodeTypesList = [
    { type: "agent", label: "Agent", color: "var(--accent)" },
    { type: "router", label: "Router", color: "#f59e0b" },
    { type: "human", label: "Human Gate", color: "#8b5cf6" },
    { type: "output", label: "Output", color: "#10b981" },
    { type: "note", label: "Note", color: "#64748b" },
  ]

  return (
    <div className="flex h-full">
      <div ref={reactFlowWrapper} className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange}
          onConnect={onConnect} onNodeClick={onNodeClick} onNodeDoubleClick={onNodeDoubleClick}
          onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
          nodeTypes={nodeTypes} fitView
        >
          <Background /><Controls /><MiniMap />
        </ReactFlow>

        {edgeMenu && (
          <div className="absolute z-50" style={{ left: edgeMenu.x, top: edgeMenu.y }}>
            <EdgeMenu condition={edgeMenu.condition} onSave={onSaveEdgeCondition} onDelete={onDeleteEdge} />
          </div>
        )}

        {/* Node palette */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
          {nodeTypesList.map((nt) => (
            <div key={nt.type} draggable
              onDragStart={(e) => { e.dataTransfer.setData("application/reactflow", nt.type); e.dataTransfer.effectAllowed = "move" }}
              className="px-2.5 py-1.5 text-white text-[11px] rounded-lg cursor-grab active:cursor-grabbing transition-all hover:opacity-90 flex items-center gap-1.5 shadow-sm"
              style={{ background: nt.color }}
            >
              + {nt.label}
            </div>
          ))}
        </div>
      </div>

      <NodeConfigPanel node={selectedNode} onClose={() => setSelectedNode(null)} onUpdate={onUpdateNodeData} />
    </div>
  )
}

export default function Canvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  )
}
