import { useState } from "react"
import { useProviders, useCreateProvider, useDeleteProvider, usePresets } from "../api/providers"
import type { ProviderFormData } from "../api/providers"
import { Button, Card, Badge, Dialog, Input, Select, SkeletonRow } from "../components/ui"

export default function ProvidersPage() {
  const { data: providers, isLoading } = useProviders()
  const { data: presets } = usePresets()
  const createProvider = useCreateProvider()
  const deleteProvider = useDeleteProvider()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProviderFormData>({
    name: "", provider_type: "custom", base_url: "", api_key: "",
  })

  const applyPreset = (type: string) => {
    const p = presets?.find((pr) => pr.type === type)
    if (p) setForm((f) => ({ ...f, name: p.label, provider_type: type, base_url: p.base_url }))
  }

  const handleSave = () => {
    if (!form.name || !form.base_url) return
    createProvider.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ name: "", provider_type: "custom", base_url: "", api_key: "" }) } })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">LLM Providers</h1>
        <Button onClick={() => setShowForm(true)}>+ Add Provider</Button>
      </div>

      {isLoading && <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} />)}</div>}

      <div className="space-y-3">
        {providers?.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-gray-300"}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{p.name}</span>
                  <Badge variant="info">{p.provider_type}</Badge>
                  {!p.is_active && <Badge variant="warning">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted mt-0.5">{p.base_url}</p>
                {p.models.length > 0 && (
                  <p className="text-xs text-muted mt-1">{p.models.length} models configured</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this provider?")) deleteProvider.mutate(p.id) }} className="text-rose-500">
              Remove
            </Button>
          </Card>
        ))}
        {providers?.length === 0 && !isLoading && (
          <p className="text-sm text-muted text-center py-12">No providers configured. Add one to get started.</p>
        )}
      </div>

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Add LLM Provider">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {presets?.map((p) => (
              <button
                key={p.type}
                onClick={() => applyPreset(p.type)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  form.provider_type === p.type ? "bg-accent text-white border-accent" : "border-border hover:bg-accent-soft"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My OpenAI" />
          <Input label="Base URL" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.openai.com/v1" />
          <Input label="API Key" type="password" value={form.api_key ?? ""} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="sk-..." />
          <Select
            label="Provider Type"
            value={form.provider_type}
            onChange={(e) => setForm({ ...form, provider_type: e.target.value })}
            options={[
              ...(presets?.map((p) => ({ value: p.type, label: p.label })) ?? []),
              { value: "custom", label: "Custom" },
            ]}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.base_url}>Save</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
