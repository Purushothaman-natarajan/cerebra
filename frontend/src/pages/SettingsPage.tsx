/** Settings page — cost config, security transparency, danger zone. */

import { useState } from "react"
import { Card, Input, Button, Dialog } from "@/components/ui"
import { apiFetch } from "@/api/client"
import { useTheme } from "@/contexts/ThemeContext"
import { Shield, Bell, Sliders, AlertTriangle, Check, Key, DollarSign, Download, Trash2 } from "lucide-react"

const DEFAULT_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.30 },
  "gemini-2.0-pro": { input: 0.50, output: 1.50 },
  "gemini-1.5-flash": { input: 0.075, output: 0.30 },
  "gemini-1.5-pro": { input: 0.50, output: 1.50 },
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-3.5-turbo": { input: 0.50, output: 1.50 },
  "claude-3-opus": { input: 15.00, output: 75.00 },
  "claude-3-sonnet": { input: 3.00, output: 15.00 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },
}

type PricingMap = Record<string, { input: number; output: number }>

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [platformName, setPlatformName] = useState("Cerebra-AI")
  const [notifyFailure, setNotifyFailure] = useState(() => localStorage.getItem("cerebra-notify-failure") !== "false")
  const [notifyComplete, setNotifyComplete] = useState(() => localStorage.getItem("cerebra-notify-complete") === "true")
  const [saved, setSaved] = useState(false)

  // Cost pricing
  const [pricing, setPricing] = useState<PricingMap>(() => {
    const stored = localStorage.getItem("cerebra-pricing")
    return stored ? JSON.parse(stored) : { ...DEFAULT_PRICING }
  })
  const [newModel, setNewModel] = useState("")
  const [newInputPrice, setNewInputPrice] = useState("0.10")
  const [newOutputPrice, setNewOutputPrice] = useState("0.40")

  // Danger zone
  const [showClearKeys, setShowClearKeys] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const handleSavePrefs = () => {
    localStorage.setItem("cerebra-notify-failure", String(notifyFailure))
    localStorage.setItem("cerebra-notify-complete", String(notifyComplete))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updatePrice = (model: string, field: "input" | "output", value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    setPricing((prev) => ({
      ...prev,
      [model]: { ...prev[model], [field]: num },
    }))
  }

  const addModelPricing = () => {
    if (!newModel.trim()) return
    setPricing((prev) => ({
      ...prev,
      [newModel.trim()]: { input: parseFloat(newInputPrice) || 0.10, output: parseFloat(newOutputPrice) || 0.40 },
    }))
    setNewModel("")
  }

  const removeModelPricing = (model: string) => {
    setPricing((prev) => {
      const next = { ...prev }
      delete next[model]
      return next
    })
  }

  const savePricing = () => {
    localStorage.setItem("cerebra-pricing", JSON.stringify(pricing))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearAllKeys = async () => {
    try {
      await apiFetch("/providers/clear-keys", { method: "POST" })
    } catch { /* backend might be offline */ }
    const providerKeys = Object.keys(localStorage).filter((k) => k.startsWith("cerebra-provider-"))
    providerKeys.forEach((k) => localStorage.removeItem(k))
    setShowClearKeys(false)
  }

  const handleExportData = () => {
    const data: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) data[key] = localStorage.getItem(key) || ""
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cerebra-ai-settings-export.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string)
        })
        window.location.reload()
      } catch {
        alert("Invalid export file")
      }
    }
    input.click()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>

      {/* General */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold text-foreground">General</h2>
        </div>
        <div className="space-y-4">
          <Input label="Platform Name" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Theme</label>
            <div className="flex flex-wrap gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`px-4 py-2 text-sm rounded-xl border transition-all duration-200 ${
                    theme === t ? "bg-accent text-white border-accent shadow-sm" : "border-border hover:bg-accent-soft hover:border-accent/30"
                  }`}
                >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="space-y-2">
          {[
            { label: "Notify on run failure", key: "failure", checked: notifyFailure, set: setNotifyFailure },
            { label: "Notify on run complete", key: "complete", checked: notifyComplete, set: setNotifyComplete },
          ].map((n) => (
            <label key={n.key} className="flex items-center gap-3 text-sm cursor-pointer p-2.5 rounded-xl hover:bg-accent-soft transition-colors">
              <input type="checkbox" checked={n.checked} onChange={(e) => n.set(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-accent" />
              <span className="text-foreground">{n.label}</span>
            </label>
          ))}
          <Button size="sm" onClick={handleSavePrefs} className="mt-2 gap-2">
            {saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Preferences"}
          </Button>
        </div>
      </Card>

      {/* Cost Defaults */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold text-foreground">Cost Defaults (per 1M tokens, USD)</h2>
        </div>
        <p className="text-xs text-muted mb-4">These prices are used to estimate run costs. They don't affect actual API billing.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="text-left py-2 pr-4">Model</th>
                <th className="text-right py-2 px-2">Input</th>
                <th className="text-right py-2 px-2">Output</th>
                <th className="w-8 py-2" />
              </tr>
            </thead>
            <tbody>
              {Object.entries(pricing).map(([model, prices]) => (
                <tr key={model} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-foreground font-mono">{model}</td>
                  <td className="py-2 px-2">
                    <input type="number" step="0.01" min="0" value={prices.input}
                      onChange={(e) => updatePrice(model, "input", e.target.value)}
                      className="w-20 text-right bg-surface border border-border rounded-lg px-2 py-1 text-xs text-foreground" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" step="0.01" min="0" value={prices.output}
                      onChange={(e) => updatePrice(model, "output", e.target.value)}
                      className="w-20 text-right bg-surface border border-border rounded-lg px-2 py-1 text-xs text-foreground" />
                  </td>
                  <td className="py-2">
                    <button onClick={() => removeModelPricing(model)}
                      className="p-1 rounded text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <input value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="New model name"
            className="flex-1 min-w-[140px] bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted" />
          <input type="number" step="0.01" min="0" value={newInputPrice} onChange={(e) => setNewInputPrice(e.target.value)}
            className="w-20 text-right bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-foreground" placeholder="Input" />
          <input type="number" step="0.01" min="0" value={newOutputPrice} onChange={(e) => setNewOutputPrice(e.target.value)}
            className="w-20 text-right bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-foreground" placeholder="Output" />
          <Button size="sm" variant="outline" onClick={addModelPricing}>Add</Button>
        </div>
        <Button size="sm" onClick={savePricing} className="mt-4 gap-2">
          {saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Pricing"}
        </Button>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-500" />
          <h2 className="font-semibold text-foreground">Security</h2>
        </div>
        <p className="text-sm text-muted mb-3">Provider API keys are encrypted at rest before being stored in the database.</p>
        <div className="text-sm text-muted space-y-2">
          <p>• <strong>Encryption</strong>: Keys are encrypted using <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">Fernet</code> (symmetric authenticated encryption) with a key derived from <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">PBKDF2-HMAC-SHA256</code> and a random 16-byte salt. Each deployment generates a unique encryption key stored in <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">CEREBRA_ENCRYPTION_KEY</code>.</p>
          <p>• <strong>Masking</strong>: API keys are always masked in API responses — only the first 4 and last 4 characters are visible (<code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">sk-••••••••••3a7f</code>). The full key is never returned.</p>
          <p>• <strong>Deletion</strong>: Deleting a provider permanently removes its encrypted key from the database. There is no recovery mechanism.</p>
          <p>• <strong>Transport</strong>: All API communication uses HTTPS. WebSocket connections can optionally require an auth token.</p>
          <p>• <strong>Local Storage</strong>: UI preferences are stored in <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">localStorage</code>. No API keys are stored on the frontend.</p>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-200 dark:border-rose-900">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <h2 className="font-semibold text-rose-600">Danger Zone</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-rose-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Clear All API Keys</p>
                <p className="text-xs text-muted">Permanently remove all stored provider API keys from the database.</p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowClearKeys(true)}>Clear Keys</Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-rose-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Export / Import Settings</p>
                <p className="text-xs text-muted">Download or restore all settings data (export does not include API keys).</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportData}>Export</Button>
              <Button variant="outline" size="sm" onClick={handleImportData}>Import</Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Reset Platform</p>
                <p className="text-xs text-muted">Clear all local settings and preferences. This cannot be undone.</p>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowReset(true)}>Reset</Button>
          </div>
        </div>
      </Card>

      {/* Clear Keys Dialog */}
      <Dialog open={showClearKeys} onClose={() => setShowClearKeys(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Clear All API Keys?</h3>
          <p className="text-sm text-muted">This will permanently remove all provider API keys from the database. This action cannot be undone. You will need to re-enter keys to use LLM providers.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowClearKeys(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClearAllKeys}>Clear All Keys</Button>
          </div>
        </div>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={showReset} onClose={() => setShowReset(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Reset Platform?</h3>
          <p className="text-sm text-muted">This will clear all local settings and preferences. Provider data in the database will not be affected. You'll need to reconfigure your preferences.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { localStorage.clear(); window.location.reload() }}>Reset</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
