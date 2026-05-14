/** Settings page — general platform config, execution defaults, notifications, danger zone. */

import { useState } from "react"
import { Card, Input, Button } from "../components/ui"
import { useTheme } from "../contexts/ThemeContext"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [platformName, setPlatformName] = useState("Orchid")

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="space-y-6">
        <Card>
          <h2 className="font-semibold text-foreground mb-4">General</h2>
          <div className="space-y-4">
            <Input label="Platform Name" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Theme</label>
              <div className="flex gap-2">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      theme === t ? "bg-accent text-white border-accent" : "border-border hover:bg-accent-soft"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-foreground mb-4">Execution Defaults</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Default Timeout (s)" type="number" defaultValue={60} />
            <Input label="Max Iterations" type="number" defaultValue={10} />
            <Input label="Token Budget" type="number" defaultValue={10000} className="col-span-2" />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-foreground mb-4">Notifications</h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-border accent-accent" />
            Notify on run failure
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
            <input type="checkbox" className="rounded border-border accent-accent" />
            Notify on run complete
          </label>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900">
          <h2 className="font-semibold text-rose-600 mb-4">Danger Zone</h2>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">Export All Data</Button>
            <Button variant="danger" size="sm">Reset Platform</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
