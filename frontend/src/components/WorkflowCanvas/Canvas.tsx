import { useCallback, useRef, useState } from "react"
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
import EdgeMenu from "./EdgeMenu"

const nodeTypes = { agent: AgentNode, router: RouterNode }

interface Props {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onCanvasChange?: (nodes: Node[], edges: Edge[]) => void
}

let nodeId = 0
function newNodeId() {
  nodeId += 1
  return `node_${nodeId}`
}

function Flow({
  initialNodes = [],
  initialEdges = [],
  onCanvasChange,
}: {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onCanvasChange?: (nodes: Node[], edges: Edge[]) => void
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [edgeMenu, setEdgeMenu] = useState<{ edgeId: string; x: number; y: number; condition: string | null } | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
      setTimeout(() => onCanvasChange?.(nodes, edges), 0)
    },
    [onNodesChange, nodes, edges, onCanvasChange]
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes)
      setTimeout(() => onCanvasChange?.(nodes, edges), 0)
    },
    [onEdgesChange, nodes, edges, onCanvasChange]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const edge: Edge = {
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: "smoothstep",
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges]
  )

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setEdgeMenu({
      edgeId: edge.id,
      x: _event.clientX,
      y: _event.clientY,
      condition: edge.data?.condition ?? null,
    })
  }, [])

  const onSaveEdgeCondition = useCallback(
    (condition: string | null) => {
      if (!edgeMenu) return
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeMenu.edgeId ? { ...e, data: { ...e.data, condition } } : e
        )
      )
      setEdgeMenu(null)
    },
    [edgeMenu, setEdges]
  )

  const onDeleteEdge = useCallback(() => {
    if (!edgeMenu) return
    setEdges((eds) => eds.filter((e) => e.id !== edgeMenu.edgeId))
    setEdgeMenu(null)
  }, [edgeMenu, setEdges])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData("application/reactflow")
      if (!type) return
      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return
      const newNode: Node = {
        id: newNodeId(),
        type,
        position: { x: event.clientX - bounds.left - 80, y: event.clientY - bounds.top - 20 },
        data: { label: type === "agent" ? "New Agent" : "New Router", tools: [], conditions: [] },
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {edgeMenu && (
        <div className="absolute z-50" style={{ left: edgeMenu.x, top: edgeMenu.y }}>
          <EdgeMenu condition={edgeMenu.condition} onSave={onSaveEdgeCondition} onDelete={onDeleteEdge} />
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/reactflow", "agent")
            e.dataTransfer.effectAllowed = "move"
          }}
          className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg cursor-grab active:cursor-grabbing hover:bg-blue-700"
        >
          + Agent
        </div>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/reactflow", "router")
            e.dataTransfer.effectAllowed = "move"
          }}
          className="px-3 py-2 bg-amber-600 text-white text-xs rounded-lg cursor-grab active:cursor-grabbing hover:bg-amber-700"
        >
          + Router
        </div>
      </div>
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
