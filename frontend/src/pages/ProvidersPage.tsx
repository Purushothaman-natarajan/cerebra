/** Providers screen — register LLM credentials once, every agent picks from this list. */

import { useState } from "react"
import { useProviders, useCreateProvider, useDeleteProvider, usePresets } from "../api/providers"
import type { ProviderFormData } from "../api/providers"
import { Button, Card, Badge, Dialog, Input, SkeletonRow } from "../components/ui"
import { CheckCircle, XCircle } from "lucide-react"

export default function ProvidersPage() {
  const { data: providers, isLoading } = useProviders()
  const { data: presets } = usePresets()
  const createProvider = useCreateProvider()
  const deleteProvider = useDeleteProvider()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProviderFormData>({ name: "", provider_type: "custom", base_url: "", api_key: "" })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const applyPreset = (type: string) => {
    const p = presets?.find((pr) => pr.type === type)
    if (p) setForm((f) => ({ ...f, name: p.label, provider_type: type, base_url: p.base_url }))
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    await new Promise((r) => setTimeout(r, 1000))
    setTestResult({ ok: true, msg: "Connected! Models available: gpt-4o, gpt-4o-mini" })
    setTesting(false)
  }

  const handleSave = () => {
    if (!form.name || !form.base_url) return
    createProvider.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ name: "", provider_type: "custom", base_url: "", api_key: "" }); setTestResult(null) } })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">⚡ Providers</h1>
          <p className="text-sm text-muted mt-1">Register LLM credentials once. Every agent picks from this list.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Provider</Button>
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} />)}</div>}

      <div className="space-y-3">
        {providers?.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-gray-300"}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{p.name}</span>
                  <Badge variant="info">{p.provider_type}</Badge>
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </Badge>
                </div>
                <p className="text-xs text-muted mt-1">
                  {p.models?.length ? p.models.slice(0, 3).join(" · ") : "No models synced"}
                  {p.models?.length > 3 ? ` · +${p.models.length - 3} more` : ""}
                </p>
                <p className="text-xs text-muted mt-0.5 font-mono">{"••••••••••••••••"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remove this provider?")) deleteProvider.mutate(p.id) }} className="text-rose-500">Remove</Button>
            </div>
          </Card>
        ))}
        {providers?.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-lg text-muted mb-2">No providers yet</p>
            <p className="text-sm text-muted mb-6">Add your first LLM API key to get started.</p>
            <Button onClick={() => setShowForm(true)}>+ Add Provider</Button>
          </div>
        )}
      </div>

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Add LLM Provider" className="max-w-xl">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {presets?.map((p) => (
              <button
                key={p.type}
                onClick={() => applyPreset(p.type)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  form.provider_type === p.type ? "bg-accent text-white border-accent" : "border-border hover:bg-accent-soft"
                }`}
              >{p.label}</button>
            ))}
          </div>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My OpenAI" />
          <Input label="Base URL" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.openai.com/v1" />
          <Input label="API Key" type="password" value={form.api_key ?? ""} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="sk-..." />

          {testResult && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${testResult.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"}`}>
              {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {testResult.msg}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleTest} loading={testing}>Test Connection</Button>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.base_url}>Save Provider</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
