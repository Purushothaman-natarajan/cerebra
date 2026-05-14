/** Tools screen — responsive grid with icons, built-in, custom tools. */

import { useState } from "react"
import { useTools, useCreateTool, useDeleteTool } from "@/api/tools"
import type { ToolFormData } from "@/api/tools"
import { Button, Card, Badge, Dialog, SkeletonCard } from "@/components/ui"
import ToolForm from "@/components/ToolBuilder/ToolForm"
import { Search, Calculator, Globe, Plus } from "lucide-react"

const toolIcons: Record<string, typeof Search> = {
  web_search: Search, calculator: Calculator, http_request: Globe, web_crawler: Globe,
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">🔧 Tools</h1>
          <p className="text-sm text-muted mt-0.5">Reusable capabilities your agents can use.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="shrink-0">+ Create Tool</Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && builtin.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Built-in</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {builtin.map((tool) => {
              const Icon = toolIcons[tool.name] || Globe
              return (
                <Card key={tool.name} hover className="flex items-start gap-3 sm:gap-4 p-4">
                  <div className="p-2.5 rounded-xl bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-foreground text-sm truncate">{tool.name}</span>
                      <Badge variant="info" className="shrink-0">system</Badge>
                    </div>
                    <p className="text-xs text-muted truncate">{tool.description || "Built-in tool"}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {!isLoading && (
        <>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Custom Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {custom.map((tool) => (
              <Card key={tool.id} hover className="p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="min-w-0">
                    <span className="font-medium text-foreground text-sm truncate block">{tool.name}</span>
                    <p className="text-xs text-muted mt-0.5 truncate">{tool.description}</p>
                  </div>
                  <Badge className="shrink-0">{tool.tool_type}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete?")) deleteTool.mutate(tool.id!) }} className="text-rose-500">Delete</Button>
              </Card>
            ))}
            <Card hover className="border-dashed flex items-center justify-center min-h-[120px] cursor-pointer p-4" onClick={() => setShowForm(true)}>
              <div className="text-center">
                <Plus className="w-6 h-6 text-muted mx-auto mb-2" />
                <p className="text-sm font-medium text-muted">Create a custom tool</p>
                <p className="text-xs text-muted mt-1">HTTP, Python, or OpenAPI</p>
              </div>
            </Card>
            {custom.length === 0 && (
              <p className="text-sm text-muted col-span-full text-center py-6">No custom tools yet.</p>
            )}
          </div>
        </>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Create Custom Tool" className="max-w-xl">
        <ToolForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Dialog>
    </div>
  )
}
