import { useState, useEffect } from "react"
import type { AgentFormData } from "../../api/agents"

const MODELS = ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro", "gemini-1.5-flash"]
const AVAILABLE_TOOLS = ["web_search", "calculator", "http_request", "web_crawler"]

interface Props {
  initial?: AgentFormData
  onSave: (data: AgentFormData) => void
  onCancel: () => void
}

export default function AgentForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<AgentFormData>({
    name: "",
    role: "",
    system_prompt: "",
    model: "gemini-2.0-flash",
    tools: [],
    memory_enabled: false,
    max_iterations: 10,
    guardrails: { blocked_topics: [], max_tokens: 4096 },
  })

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const update = (key: keyof AgentFormData, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  const toggleTool = (tool: string) => {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter((t) => t !== tool) : [...f.tools, tool],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg bg-white dark:bg-slate-900">
      <h2 className="text-lg font-semibold">{initial ? "Edit Agent" : "New Agent"}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">System Prompt</label>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm h-24"
          value={form.system_prompt}
          onChange={(e) => update("system_prompt", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <select className="w-full border rounded px-3 py-2 text-sm" value={form.model} onChange={(e) => update("model", e.target.value)}>
            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Iterations</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2 text-sm"
            value={form.max_iterations}
            onChange={(e) => update("max_iterations", Number(e.target.value))}
            min={1}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tools</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              className={`px-3 py-1 text-xs rounded-full border ${
                form.tools.includes(tool) ? "bg-blue-600 text-white" : "bg-transparent"
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="memory"
          checked={form.memory_enabled}
          onChange={(e) => update("memory_enabled", e.target.checked)}
        />
        <label htmlFor="memory" className="text-sm">Enable Memory</label>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          {initial ? "Update" : "Create"}
        </button>
      </div>
    </form>
  )
}
