/** Tool creation form — HTTP, Python, or Webhook tool builder with parameter definitions. */

import { useState } from "react"
import type { ToolFormData } from "@/api/tools"
import { Button, Input, Select, Textarea } from "@/components/ui"

interface Props {
  onSave: (data: ToolFormData) => void
  onCancel: () => void
}

export default function ToolForm({ onSave, onCancel }: Props) {
  const [form, setForm] = useState<ToolFormData>({
    name: "", description: "", tool_type: "http",
    config: { url: "", method: "GET", headers: {}, parameters: [] },
  })
  const [params, setParams] = useState<{ name: string; type: "string" | "number" | "boolean"; description: string }[]>([])

  const update = <K extends keyof ToolFormData>(key: K, value: ToolFormData[K]) => setForm({ ...form, [key]: value })
  const updateConfig = (key: string, value: unknown) => setForm({ ...form, config: { ...form.config, [key]: value } })

  const addParam = () => setParams([...params, { name: "", type: "string", description: "" }])
  const updateParam = (i: number, key: string, value: string) => {
    const next = [...params]; next[i] = { ...next[i], [key]: value }; setParams(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...form, config: { ...form.config, parameters: params } })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Tool Name" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="my_custom_tool" />
      <Textarea label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} placeholder="What does this tool do?" />
      <Select label="Type" value={form.tool_type} onChange={(e) => update("tool_type", e.target.value as ToolFormData["tool_type"])}
        options={[{ value: "http", label: "HTTP Request" }, { value: "python", label: "Python Code" }, { value: "webhook", label: "Webhook" }]}
      />

      {form.tool_type === "http" && (
        <>
          <Input label="URL" value={form.config.url ?? ""} onChange={(e) => updateConfig("url", e.target.value)} placeholder="https://api.example.com/action" />
          <Select label="Method" value={form.config.method ?? "GET"} onChange={(e) => updateConfig("method", e.target.value)}
            options={[{ value: "GET", label: "GET" }, { value: "POST", label: "POST" }, { value: "PUT", label: "PUT" }, { value: "DELETE", label: "DELETE" }]}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Parameters</label>
            {params.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input value={p.name} onChange={(e) => updateParam(i, "name", e.target.value)} placeholder="name" className="flex-1" />
                <select value={p.type} onChange={(e) => updateParam(i, "type", e.target.value)}
                  className="rounded-lg border border-border bg-card px-2 py-2 text-sm">
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                </select>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addParam}>+ Add Parameter</Button>
          </div>
        </>
      )}

      {form.tool_type === "python" && (
        <Textarea label="Python Code" value={form.config.code ?? ""} onChange={(e) => updateConfig("code", e.target.value)} rows={8}
          placeholder='async def run(params: dict) -> str:\n  return f"Hello {params.get("name", "world")}"' />
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Create Tool</Button>
      </div>
    </form>
  )
}
