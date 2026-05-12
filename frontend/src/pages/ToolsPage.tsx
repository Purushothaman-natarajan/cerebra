import { useState } from "react"
import { useTools, useCreateTool, useDeleteTool } from "../api/tools"
import type { ToolFormData } from "../api/tools"
import { Button, Card, Badge, Dialog, SkeletonCard } from "../components/ui"
import ToolForm from "../components/ToolBuilder/ToolForm"

export default function ToolsPage() {
  const { data: tools, isLoading } = useTools()
  const createTool = useCreateTool()
  const deleteTool = useDeleteTool()
  const [showForm, setShowForm] = useState(false)

  const handleSave = (data: ToolFormData) => {
    createTool.mutate(data, { onSuccess: () => setShowForm(false) })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tools</h1>
        <Button onClick={() => setShowForm(true)}>+ New Tool</Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools?.map((tool) => (
          <Card key={tool.id ?? tool.name} hover>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{tool.name}</span>
                  {tool.is_builtin ? <Badge variant="info">system</Badge> : <Badge variant="default">custom</Badge>}
                </div>
                <p className="text-xs text-muted mt-1">{tool.description}</p>
              </div>
              <Badge>{tool.tool_type}</Badge>
            </div>
            {!tool.is_builtin && (
              <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this tool?")) deleteTool.mutate(tool.id!) }} className="text-rose-500">
                Delete
              </Button>
            )}
          </Card>
        ))}
        {tools?.length === 0 && !isLoading && (
          <p className="text-sm text-muted text-center py-12 col-span-2">No tools yet. Create one to extend your agents.</p>
        )}
      </div>

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Create Custom Tool">
        <ToolForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Dialog>
    </div>
  )
}
