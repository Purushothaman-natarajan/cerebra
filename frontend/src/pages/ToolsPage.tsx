/** Tools screen — reusable capabilities agents can use. Built-in + custom tools. */

import { useState } from "react"
import { useTools, useCreateTool, useDeleteTool } from "../api/tools"
import type { ToolFormData } from "../api/tools"
import { Button, Card, Badge, Dialog, SkeletonCard } from "../components/ui"
import ToolForm from "../components/ToolBuilder/ToolForm"
import { Search, Calculator, Globe, Plus } from "lucide-react"

const toolIcons: Record<string, typeof Search> = {
  web_search: Search,
  calculator: Calculator,
  http_request: Globe,
  web_crawler: Globe,
}

export default function ToolsPage() {
  const { data: tools, isLoading } = useTools()
  const createTool = useCreateTool()
  const deleteTool = useDeleteTool()
  const [showForm, setShowForm] = useState(false)

  const handleSave = (data: ToolFormData) => createTool.mutate(data, { onSuccess: () => setShowForm(false) })

  const builtin = tools?.filter((t) => t.is_builtin) ?? []
  const custom = tools?.filter((t) => !t.is_builtin) ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🔧 Tools</h1>
          <p className="text-sm text-muted mt-1">Reusable capabilities your agents can use.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Create Tool</Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && builtin.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">Built-in</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {builtin.map((tool) => {
              const Icon = toolIcons[tool.name] || Globe
              return (
                <Card key={tool.name} hover className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">{tool.name}</span>
                      <Badge variant="info">system</Badge>
                    </div>
                    <p className="text-xs text-muted">{tool.description || "Built-in tool"}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {!isLoading && (custom.length > 0 || true) && (
        <>
          <h2 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">Custom Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {custom.map((tool) => (
              <Card key={tool.id} hover>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-foreground text-sm">{tool.name}</span>
                    <p className="text-xs text-muted mt-0.5">{tool.description}</p>
                  </div>
                  <Badge>{tool.tool_type}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this tool?")) deleteTool.mutate(tool.id!) }} className="text-rose-500">Delete</Button>
              </Card>
            ))}
            <Card
              hover
              className="border-dashed flex items-center justify-center min-h-[100px] cursor-pointer"
              onClick={() => setShowForm(true)}
            >
              <div className="text-center">
                <Plus className="w-6 h-6 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">Create a custom tool</p>
                <p className="text-xs text-muted">HTTP endpoint, Python function, or OpenAPI spec</p>
              </div>
            </Card>
          </div>
        </>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Create Custom Tool" className="max-w-xl">
        <ToolForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Dialog>
    </div>
  )
}
