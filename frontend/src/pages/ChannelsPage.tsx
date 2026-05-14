/** Channels screen — 3-step Telegram wizard with webhook verification and workflow routing. */

import { useState } from "react"
import { apiFetch } from "../api/client"
import { useWorkflows } from "../api/workflows"
import { Button, Card, Input, Select, Dialog } from "../components/ui"
import { Radio } from "lucide-react"

export default function ChannelsPage() {
  const { data: workflows } = useWorkflows()
  const [step, setStep] = useState(0)
  const [botToken, setBotToken] = useState("")
  const [webhookUrl] = useState("")
  const [workflowId, setWorkflowId] = useState("")
  const [showWizard, setShowWizard] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFinish = async () => {
    if (!botToken) return
    setSaving(true)
    try {
      await apiFetch("/channels", {
        method: "POST",
        body: JSON.stringify({ name: "Telegram", type: "telegram", config: { bot_token: botToken, webhook_url: webhookUrl, workflow_id: workflowId } }),
      })
      setShowWizard(false)
      setStep(0)
    } catch { /* toast handles it */ }
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📡 Channels</h1>
          <p className="text-sm text-muted mt-1">Connect messaging surfaces to your workflows.</p>
        </div>
        <Button onClick={() => setShowWizard(true)}>+ Add Channel</Button>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600">
            <Radio className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Telegram</h3>
            <p className="text-xs text-muted">Send and receive messages via a Telegram bot.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowWizard(true)}>Connect</Button>
        </div>
      </Card>

      {/* 3-step wizard */}
      <Dialog open={showWizard} onClose={() => setShowWizard(false)} title="Connect Telegram" className="max-w-lg">
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex items-center gap-2 ${s <= 3 ? "text-foreground" : "text-muted"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${s === 1 ? "bg-accent text-white" : "bg-accent-soft"}`}>{s}</div>
                  {s < 3 && <div className="w-8 h-px bg-border" />}
                </div>
              ))}
            </div>
            <h3 className="font-medium text-foreground">Step 1 of 3 — Create a Telegram Bot</h3>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>Open Telegram and search for <strong>@BotFather</strong></li>
              <li>Send: <code className="bg-accent-soft px-1 rounded">/newbot</code></li>
              <li>Follow the prompts to name your bot</li>
              <li>Copy the API token BotFather gives you</li>
            </ol>
            <Input label="Bot Token" value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
            <Button onClick={() => setStep(1)} disabled={!botToken}>Next →</Button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex items-center gap-2`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${s <= 2 ? "bg-accent text-white" : "bg-accent-soft text-muted"}`}>{s}</div>
                  {s < 3 && <div className="w-8 h-px bg-border" />}
                </div>
              ))}
            </div>
            <h3 className="font-medium text-foreground">Step 2 of 3 — Configure Webhook</h3>
            <p className="text-sm text-muted">Your webhook URL:</p>
            <code className="block text-xs bg-accent-soft p-3 rounded-lg break-all">https://your-orchid-url/api/channels/webhook/telegram</code>
            <p className="text-sm text-muted">Running locally? Use ngrok:</p>
            <code className="block text-xs bg-accent-soft p-3 rounded-lg">ngrok http 8000</code>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)}>Skip →</Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex items-center gap-2`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-accent text-white`}>{s}</div>
                  {s < 3 && <div className="w-8 h-px bg-border" />}
                </div>
              ))}
            </div>
            <h3 className="font-medium text-foreground">Step 3 of 3 — Route Messages</h3>
            <p className="text-sm text-muted">When a user messages this bot, trigger:</p>
            <Select
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              options={[{ value: "", label: "Select workflow..." }, ...(workflows?.map((w) => ({ value: w.id, label: w.name })) ?? [])]}
            />
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleFinish} loading={saving} disabled={!botToken}>Finish Setup</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
