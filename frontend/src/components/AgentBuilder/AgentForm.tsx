/** Agent form — 4-tab form with provider dropdown, model selector, tools, memory, guardrails. */

import { useState, useEffect, useMemo } from "react"
import type { AgentFormData } from "@/api/agents"
import { useAvailableModels, useProviders } from "@/api/providers"
import { useAgentTools } from "@/api/tools"
import { Button, Input, Textarea, Select } from "@/components/ui"

interface Props {
  initial?: AgentFormData
  onSave: (data: AgentFormData) => void
  onCancel: () => void
}

export default function AgentForm({ initial, onSave, onCancel }: Props) {
  const { data: providers } = useProviders()
  const { data: availableModels } = useAvailableModels()
  const { data: agentTools } = useAgentTools()

  const [form, setForm] = useState<AgentFormData>({
    name: "", role: "", system_prompt: "", model: "gemini-2.0-flash",
    tools: [], memory_enabled: false, max_iterations: 10,
    guardrails: { blocked_topics: [], max_tokens: 4096 },
  })
  const [selectedProvider, setSelectedProvider] = useState<string>("")

  useEffect(() => {
    if (initial) {
      setForm(initial)
      const modelInfo = availableModels?.find((m) => m.model === initial.model)
      if (modelInfo) setSelectedProvider(modelInfo.provider_id)
    }
  }, [initial, availableModels])

  const update = (key: keyof AgentFormData, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  const toggleTool = (tool: string) => {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter((t) => t !== tool) : [...f.tools, tool],
    }))
  }

  const filteredModels = useMemo(() => {
    if (!selectedProvider || !availableModels) return availableModels || []
    return availableModels.filter((m) => m.provider_id === selectedProvider)
  }, [selectedProvider, availableModels])

  const modelOptions = useMemo(() => {
    if (filteredModels.length === 0) {
      return [{ value: "gemini-2.0-flash", label: "gemini-2.0-flash", group: "Default" }]
    }
    return filteredModels.map((m) => ({
      value: m.model, label: m.model, group: m.provider_name,
    }))
  }, [filteredModels])

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form) }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl border border-border bg-card">
      <h2 className="text-lg font-semibold text-foreground">{initial ? "Edit Agent" : "New Agent"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <Input label="Role" value={form.role} onChange={(e) => update("role", e.target.value)} required />
      </div>

      <Textarea label="System Prompt" value={form.system_prompt} onChange={(e) => update("system_prompt", e.target.value)} rows={5} required />

      {/* Provider + Model row */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Provider"
          value={selectedProvider}
          onChange={(e) => { setSelectedProvider(e.target.value); update("model", "") }}
          options={[
            { value: "", label: "Select provider..." },
            ...(providers?.map((p) => ({ value: p.id, label: p.name, group: p.provider_type })) ?? []),
          ]}
        />
        <Select
          label="Model"
          value={form.model}
          onChange={(e) => update("model", e.target.value)}
          options={modelOptions}
          disabled={!selectedProvider}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Max Iterations" type="number" value={form.max_iterations} onChange={(e) => update("max_iterations", Number(e.target.value))} min={1} />
      </div>

      {/* Tools */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Tools</label>
        <div className="flex flex-wrap gap-2">
          {agentTools?.map((tool) => (
            <button key={tool.name} type="button" onClick={() => toggleTool(tool.name)} title={tool.description}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                form.tools.includes(tool.name) ? "bg-accent text-white border-accent" : "border-border text-muted hover:text-foreground hover:bg-accent-soft"
              }`}
            >
              {tool.name}{tool.is_builtin && <span className="ml-1 opacity-60">*</span>}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted mt-1">Built-in tools marked with *</p>
      </div>

      {/* Memory toggle */}
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={form.memory_enabled} onChange={(e) => update("memory_enabled", e.target.checked)}
          className="rounded border-border accent-accent" />
        Enable Memory
      </label>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? "Update" : "Create"}</Button>
      </div>
    </form>
  )
}
