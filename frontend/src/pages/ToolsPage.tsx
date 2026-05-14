/** Tools page — list built-in tools, create/test custom tools, export/import. */

import { useState, useRef } from "react"
import { useTools, useCreateTool, useDeleteTool, exportAllTools, useImportTools } from "@/api/tools"
import type { ToolFormData } from "@/api/tools"
import { Button, Card, Badge, Dialog, SkeletonCard } from "@/components/ui"
import ToolForm from "@/components/ToolBuilder/ToolForm"
import ToolTestDialog from "@/components/ToolBuilder/ToolTestDialog"
import { Search, Calculator, Globe, Plus, Play, Clock, Dice6, AlignLeft, Braces, Link, Download, Upload } from "lucide-react"

interface TestToolState {
   name: string
   toolType: "builtin" | "custom"
   toolId: string
   initialInput?: string
 }

 const toolIcons: Record<string, typeof Search> = {
   web_search: Search, calculator: Calculator, http_request: Globe, web_crawler: Globe,
   current_time: Clock, random_number: Dice6, text_analyzer: AlignLeft, json_tool: Braces, url_info: Link,
 }

 const SAMPLE_INPUTS: Record<string, string> = {
   web_search: "latest AI frameworks 2025",
   calculator: "(3 + 5) * 2 / 4",
   current_time: "IST",
   random_number: '{"min":1,"max":100,"count":5,"unique":true}',
   text_analyzer: "The quick brown fox jumps over the lazy dog.",
   json_tool: '{"action":"format","json":"{\\"name\\":\\"test\\",\\"age\\":30}"}',
   url_info: "https://example.com",
   http_request: "https://api.github.com",
   web_crawler: "https://en.wikipedia.org/wiki/Artificial_intelligence",
 }

export default function ToolsPage() {
  const { data: tools, isLoading } = useTools()
  const createTool = useCreateTool()
  const deleteTool = useDeleteTool()
  const importTools = useImportTools()

  const [showForm, setShowForm] = useState(false)
  const [testTool, setTestTool] = useState<TestToolState | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      importTools.mutate(Array.isArray(data) ? data : [data])
    } catch { alert("Invalid JSON file") }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSave = (data: ToolFormData) => createTool.mutate(data, { onSuccess: () => setShowForm(false) })

  const builtin = tools?.filter((t) => t.is_builtin) ?? []
  const custom = tools?.filter((t) => !t.is_builtin) ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">🔧 Tools</h1>
          <p className="text-sm text-muted mt-0.5">Reusable capabilities your agents can use. Test them with live input.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}><Upload className="w-3.5 h-3.5" /> Import</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportAllTools}><Download className="w-3.5 h-3.5" /> Export</Button>
          <Button onClick={() => setShowForm(true)}>+ Create Tool</Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Built-in tools */}
      {!isLoading && builtin.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Built-in Tools</h2>
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
<Button size="sm" variant="ghost" onClick={() => setTestTool({
                     name: tool.name, toolType: "builtin", toolId: tool.name, initialInput: SAMPLE_INPUTS[tool.name] || "",
                   })}><Play className="w-3.5 h-3.5" /></Button>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Custom tools */}
      {!isLoading && (
        <>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Custom Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {custom.map((tool) => {
              const toolJson = { name: tool.name, description: tool.description, tool_type: tool.tool_type, config: tool.config }
              return (
                <Card key={tool.id} hover className="p-4">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0">
                      <span className="font-medium text-foreground text-sm truncate block">{tool.name}</span>
                      <p className="text-xs text-muted mt-0.5 truncate">{tool.description}</p>
                    </div>
                    <Badge className="shrink-0">{tool.tool_type}</Badge>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setTestTool({
                      name: tool.name, toolType: "custom", toolId: tool.id!,
                    })}>
                      <Play className="w-3.5 h-3.5" /> Test
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => {
                      const blob = new Blob([JSON.stringify(toolJson, null, 2)], { type: "application/json" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url; a.download = `${tool.name}.json`
                      a.click(); URL.revokeObjectURL(url)
                    }}><Download className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete?")) deleteTool.mutate(tool.id!) }} className="text-rose-500">Delete</Button>
                  </div>
                </Card>
              )
            })}
            {/* Create card */}
            <Card hover className="border-dashed flex items-center justify-center min-h-[120px] cursor-pointer p-4" onClick={() => setShowForm(true)}>
              <div className="text-center">
                <Plus className="w-6 h-6 text-muted mx-auto mb-2" />
                <p className="text-sm font-medium text-muted">Create a custom tool</p>
                <p className="text-xs text-muted mt-1">HTTP, Python, or Webhook</p>
              </div>
            </Card>
            {custom.length === 0 && (
              <p className="text-sm text-muted col-span-full text-center py-6">No custom tools yet.</p>
            )}
          </div>
        </>
      )}

      {/* Create dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Create Custom Tool" className="max-w-xl">
        <ToolForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Dialog>

      {/* Test dialog — supports both built-in and custom tools */}
{testTool && (
         <ToolTestDialog
           toolId={testTool.toolId}
           toolName={testTool.name}
           isBuiltin={testTool.toolType === "builtin"}
           open={!!testTool}
           onClose={() => setTestTool(null)}
           initialInput={testTool.initialInput}
         />
       )}
    </div>
  )
}