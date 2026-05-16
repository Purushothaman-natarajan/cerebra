/** Agent form — provider selector, model picker, tools, memory, guardrails. Stable render — no useEffect resets. */

import { useEffect, useMemo, useState } from "react"
import type { AgentFormData } from "@/api/agents"
import { useAvailableModels, useProviders } from "@/api/providers"
import { useAgentTools } from "@/api/tools"
import { Button, Input, Textarea, Select } from "@/components/ui"
import { useNavigate } from "react-router-dom"

interface Props {
  initial?: AgentFormData
  onSave: (data: AgentFormData) => void
  onCancel: () => void
}

export default function AgentForm({ initial, onSave, onCancel }: Props) {
  const { data: providers } = useProviders()
  const { data: availableModels } = useAvailableModels()
  const { data: agentTools } = useAgentTools()
  const navigate = useNavigate()

  const [validationError, setValidationError] = useState<string | null>(null)
  const [form, setForm] = useState<AgentFormData>(() => initial ?? {
    name: "", role: "", system_prompt: "", model: "", provider_id: null,
    tools: [], memory_enabled: false, max_iterations: 10,
    guardrails: { blocked_topics: [], max_tokens: 4096 },
  })
  const [selectedProvider, setSelectedProvider] = useState<string>(initial?.provider_id ?? "")

  const update = (key: keyof AgentFormData, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (!initial?.model || !availableModels?.length) return
    if (selectedProvider) {
      if (form.model !== initial.model) update("model", initial.model)
      return
    }
    const modelProvider = availableModels.find((m) => m.model === initial.model)
    if (modelProvider) {
      setSelectedProvider(modelProvider.provider_id)
      update("model", initial.model)
      update("provider_id", modelProvider.provider_id)
    }
  }, [availableModels, initial?.model, selectedProvider])

  const toggleTool = (tool: string) => {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter((t) => t !== tool) : [...f.tools, tool],
    }))
  }

  const modelOptions = useMemo(() => {
    if (!selectedProvider) return [{ value: "", label: "Select a provider first", group: "" }]
    if (!availableModels || availableModels.length === 0) return [{ value: "", label: "No models available", group: "" }]
    const filtered = availableModels.filter((m) => m.provider_id === selectedProvider)
    if (filtered.length === 0) return [{ value: "", label: "No models for this provider", group: "" }]
    return filtered.map((m) => ({
      value: m.model, label: m.model, group: m.provider_name,
    }))
  }, [selectedProvider, availableModels])

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.model) { setValidationError("Select a model before saving."); return }; setValidationError(null); onSave(form) }

  if (!providers || providers.length === 0) {
    return (
      <div className="space-y-4 p-6 rounded-xl border border-border bg-card text-center">
        <p className="text-muted font-medium">No LLM providers configured</p>
        <p className="text-sm text-muted mb-4">Add a provider (OpenAI, Gemini, Ollama, etc.) before creating agents.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/providers")}>Add Provider</Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl border border-border bg-card">
      <h2 className="text-lg font-semibold text-foreground">{initial ? "Edit Agent" : "New Agent"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <Input label="Role" value={form.role} onChange={(e) => update("role", e.target.value)} required />
      </div>

      <Textarea label="System Prompt" value={form.system_prompt} onChange={(e) => update("system_prompt", e.target.value)} rows={5} required />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Provider"
          value={selectedProvider}
          onChange={(e) => { setSelectedProvider(e.target.value); update("model", "") }}
          options={[
            { value: "", label: "Select provider..." },
            ...(providers?.map((p) => ({ value: p.id, label: p.name, group: p.provider_type })) ?? []),
          ]}
          required
        />
        <Select
          label="Model"
          value={form.model}
          onChange={(e) => {
            const m = e.target.value
            update("model", m)
            const info = availableModels?.find((am) => am.model === m)
            update("provider_id", info?.provider_id ?? "")
          }}
          options={modelOptions}
          disabled={!selectedProvider}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Max Iterations" type="number" value={form.max_iterations} onChange={(e) => update("max_iterations", Number(e.target.value))} min={1} />
      </div>

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

      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={form.memory_enabled} onChange={(e) => update("memory_enabled", e.target.checked)}
          className="rounded border-border accent-accent" />
        Enable Memory
      </label>

      {validationError && (
        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
          {validationError}
        </div>
      )}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? "Update" : "Create"}</Button>
      </div>
    </form>
  )
}
