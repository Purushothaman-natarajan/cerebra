/** Providers — LLM credentials with real test connection, preset examples, encrypted-at-rest. */

import { useState } from "react"
import { useProviders, useCreateProvider, useDeleteProvider, usePresets } from "@/api/providers"
import type { ProviderFormData, Preset } from "@/api/providers"
import { Button, Card, Badge, Dialog, Input, SkeletonRow } from "@/components/ui"
import { CheckCircle, XCircle, Shield, ShieldCheck, Eye, EyeOff, Wifi, ChevronDown, ChevronUp } from "lucide-react"
import { apiFetch } from "@/api/client"

function ModelList({ models }: { models: string[] }) {
  const [showAll, setShowAll] = useState(false)
  const maxVisible = 10
  const visible = showAll ? models : models.slice(0, maxVisible)
  const hasMore = models.length > maxVisible
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {visible.map((m) => (
        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft" style={{ color: "var(--accent)" }}>
          {m}
        </span>
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[10px] px-2 py-0.5 rounded-full text-muted hover:text-accent hover:bg-accent-soft transition-colors flex items-center gap-0.5"
        >
          {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showAll ? "Show less" : `${models.length - maxVisible} more`}
        </button>
      )}
    </div>
  )
}

export default function ProvidersPage() {
  const { data: providers, isLoading } = useProviders()
  const { data: presets } = usePresets()
  const createProvider = useCreateProvider()
  const deleteProvider = useDeleteProvider()
  // Models list expand/collapse handled by ModelList component internally

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProviderFormData>({ name: "", provider_type: "custom", base_url: "", api_key: "", models: [] })
  const [activePreset, setActivePreset] = useState<Preset | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string; models?: string[] } | null>(null)
  const [showKey, setShowKey] = useState(false)

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset)
    setForm({ name: preset.label, provider_type: preset.type, base_url: preset.base_url, api_key: "", models: [] })
    setTestResult(null)
  }

  const handleTest = async () => {
    if (!form.base_url) return
    setTesting(true); setTestResult(null)
    try {
      const result = await apiFetch<{ ok: boolean; models: string[] }>("/providers/test", {
        method: "POST", body: JSON.stringify({ base_url: form.base_url, api_key: form.api_key, provider_type: form.provider_type }),
      })
      setTestResult({ ok: true, msg: `Connected! Models: ${result.models.slice(0, 3).join(", ")}`, models: result.models })
      // Save discovered models to form so they're included on save
      setForm((prev) => ({ ...prev, models: result.models }))
    } catch (e) {
      setTestResult({ ok: false, msg: e instanceof Error ? e.message : "Connection failed" })
    }
    setTesting(false)
  }

  const handleSave = () => {
    if (!form.name || !form.base_url) return
    createProvider.mutate(
      { ...form, models: form.models || [] },
      { onSuccess: () => {
        setShowForm(false); setActivePreset(null)
        setForm({ name: "", provider_type: "custom", base_url: "", api_key: "", models: [] })
        setTestResult(null)
      }}
    )
  }

  const canTest = form.base_url && (form.provider_type === "ollama" || form.api_key)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            Providers <Shield className="w-4 h-4 text-emerald-500" aria-label="Encrypted at rest" />
          </h1>
          <p className="text-sm text-muted mt-0.5">API keys are encrypted at rest. Never shared.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="shrink-0">+ Add Provider</Button>
      </div>

      {/* Loading */}
      {isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>}

      {/* Provider list */}
      <div className="space-y-3">
        {providers?.map((p) => {
          const isLocal = p.provider_type === "ollama" || p.base_url.includes("localhost")
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${p.is_active ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{p.name}</span>
                      <Badge variant="info" className="text-[10px]">{p.provider_type}</Badge>
                      {isLocal ? (
                        <Badge variant="warning" className="gap-1 text-[10px]"><Wifi className="w-3 h-3" /> Self-hosted</Badge>
                      ) : (
                        <Badge variant="success" className="gap-1 text-[10px]"><ShieldCheck className="w-3 h-3" /> Encrypted</Badge>
                      )}
                    </div>
                    {p.models && p.models.length > 0 && <ModelList models={p.models} />}
                    {(!p.models || p.models.length === 0) && (
                      <p className="text-xs text-muted mt-1 italic">No models synced</p>
                    )}
                    <p className="text-xs text-muted mt-1.5 font-mono flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-emerald-500" /> key: {'•'.repeat(16)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Remove?")) deleteProvider.mutate(p.id) }} className="text-rose-500 shrink-0">Remove</Button>
              </div>
            </Card>
          )
        })}
        {providers?.length === 0 && !isLoading && (
          <div className="text-center py-12 sm:py-16">
            <Shield className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
            <p className="text-base text-muted mb-1">No providers yet</p>
            <p className="text-sm text-muted mb-5">API keys are encrypted at rest. Your credentials stay yours.</p>
            <Button onClick={() => setShowForm(true)}>+ Add Provider</Button>
          </div>
        )}
      </div>

      {/* Add Provider Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Add LLM Provider" className="max-w-xl">
        <div className="space-y-4">
          {/* Preset buttons with examples */}
          <p className="text-xs text-muted mb-1">Quick-add a provider:</p>
          <div className="flex flex-wrap gap-2">
            {presets?.map((p) => (
              <button key={p.type} onClick={() => applyPreset(p)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${
                  activePreset?.type === p.type ? "bg-accent text-white border-accent shadow-sm" : "border-border hover:bg-accent-soft"
                }`}
              >
                <div className="font-medium text-xs">{p.label}</div>
                <div className="text-[10px] opacity-70 font-mono mt-0.5">{p.key_hint}</div>
              </button>
            ))}
          </div>

          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My OpenAI" />
          <Input label="Base URL" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.openai.com/v1" />

          {/* API Key with example */}
          <div className="relative">
            <Input label="API Key"
              type={showKey ? "text" : "password"}
              value={form.api_key ?? ""}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              placeholder={activePreset?.key_hint ? `${activePreset.key_hint} (e.g. ${activePreset.key_example})` : "Paste your API key"}
            />
            <button onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-8 p-1 rounded hover:bg-accent-soft text-muted" tabIndex={-1}
              aria-label={showKey ? "Hide" : "Show"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Key format hint */}
          {activePreset && activePreset.key_example && (
            <p className="text-[10px] text-muted flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Expected format: <code className="bg-accent-soft px-1 rounded text-[10px]">{activePreset.key_example.slice(0, 20)}...</code>
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted p-2 rounded-lg bg-accent-soft/50">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Your API key will be encrypted before storage. Never shared.</span>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
              testResult.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700"
            }`}>
              {testResult.ok ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <p>{testResult.msg}</p>
                {testResult.models && testResult.models.length > 3 && (
                  <p className="text-xs mt-1 opacity-75">+{testResult.models.length - 3} more models</p>
                )}
              </div>
            </div>
          )}

          <Button variant="secondary" onClick={handleTest} loading={testing} disabled={!canTest}>Test Connection</Button>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => { setShowForm(false); setActivePreset(null) }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.base_url}>Save Provider</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
