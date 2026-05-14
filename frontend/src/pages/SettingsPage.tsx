/** Settings page — persistent toggles for notifications, execution defaults, danger zone. */

import { useState } from "react"
import { Card, Input, Button } from "@/components/ui"
import { useTheme } from "@/contexts/ThemeContext"
import { Shield, Bell, Sliders, AlertTriangle, Check } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [platformName, setPlatformName] = useState("Cerebra")
  const [notifyFailure, setNotifyFailure] = useState(() => localStorage.getItem("cerebra-notify-failure") !== "false")
  const [notifyComplete, setNotifyComplete] = useState(() => localStorage.getItem("cerebra-notify-complete") === "true")
  const [defaultTimeout, setDefaultTimeout] = useState("60")
  const [maxIterations, setMaxIterations] = useState("10")
  const [tokenBudget, setTokenBudget] = useState("10000")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem("cerebra-notify-failure", String(notifyFailure))
    localStorage.setItem("cerebra-notify-complete", String(notifyComplete))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

      {/* Execution */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold text-foreground">Execution Defaults</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Default Timeout (s)" type="number" value={defaultTimeout} onChange={(e) => setDefaultTimeout(e.target.value)} />
          <Input label="Max Iterations" type="number" value={maxIterations} onChange={(e) => setMaxIterations(e.target.value)} />
          <Input label="Token Budget" type="number" value={tokenBudget} onChange={(e) => setTokenBudget(e.target.value)} className="sm:col-span-2" />
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
          <Button size="sm" onClick={handleSave} className="mt-2 gap-2">
            {saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Preferences"}
          </Button>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-500" />
          <h2 className="font-semibold text-foreground">Security</h2>
        </div>
        <p className="text-sm text-muted mb-3">Provider API keys are encrypted at rest using Fernet (PBKDF2-SHA256).</p>
        <div className="text-sm text-muted space-y-1">
          <p>• API keys are masked in responses: <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">sk-••••••••••3a7f</code></p>
          <p>• All API routes can be protected with <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">CEREBRA_API_KEY</code></p>
          <p>• WebSocket connections require <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">?token=</code> param when auth is enabled</p>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-200 dark:border-rose-900">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <h2 className="font-semibold text-rose-600">Danger Zone</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">Export All Data</Button>
          <Button variant="danger" size="sm" onClick={() => { if (confirm("Reset all data? This cannot be undone.")) localStorage.clear() }}>Reset Platform</Button>
        </div>
      </Card>
    </div>
  )
}
