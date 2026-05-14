/** Channels page — responsive, with error/loading/empty states, professional wizard. */

import { useState } from "react"
import { apiFetch } from "@/api/client"
import { useWorkflows } from "@/api/workflows"
import { Button, Card, Input, Select, Dialog, SkeletonRow } from "@/components/ui"
import { Radio, Send, Webhook, Route } from "lucide-react"

const steps = [
  { label: "Create Bot", icon: Send },
  { label: "Webhook", icon: Webhook },
  { label: "Route", icon: Route },
]

export default function ChannelsPage() {
  const { data: workflows, isLoading: wfLoading } = useWorkflows()
  const [step, setStep] = useState(0)
  const [botToken, setBotToken] = useState("")
  const [workflowId, setWorkflowId] = useState("")
  const [showWizard, setShowWizard] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFinish = async () => {
    if (!botToken) return
    setSaving(true)
    try {
      await apiFetch("/channels", { method: "POST", body: JSON.stringify({
        name: "Telegram", type: "telegram", config: { bot_token: botToken, workflow_id: workflowId },
      })})
      setShowWizard(false); setStep(0)
    } catch { /* toast handles it */ }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Channels</h1>
          <p className="text-sm text-muted mt-0.5">Connect messaging surfaces to your workflows.</p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="shrink-0 gap-2"><Radio className="w-4 h-4" /> Add Channel</Button>
      </div>

      <Card className="flex items-center gap-4 p-5">
        <div className="p-3 rounded-xl bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
          <Radio className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground">Telegram</h3>
          <p className="text-xs text-muted">Send and receive messages via a Telegram bot.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowWizard(true)} className="shrink-0">Connect</Button>
      </Card>

      <Dialog open={showWizard} onClose={() => setShowWizard(false)} title="Connect Telegram" className="max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                i <= step ? "bg-accent text-white" : "bg-accent-soft text-muted"
              }`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i <= step ? "text-foreground" : "text-muted"}`}>{s.label}</span>
              {i < 2 && <div className={`flex-1 h-px ${i < step ? "bg-accent" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Create a Telegram Bot</h3>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>Open Telegram and search for <strong className="text-foreground">@BotFather</strong></li>
              <li>Send: <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">/newbot</code></li>
              <li>Follow the prompts to name your bot</li>
              <li>Copy the API token BotFather gives you</li>
            </ol>
            <Input label="Bot Token" value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
            <div className="flex justify-end"><Button onClick={() => setStep(1)} disabled={!botToken}>Next →</Button></div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Configure Webhook</h3>
            <p className="text-sm text-muted">Your webhook URL:</p>
            <code className="block text-xs bg-accent-soft p-3 rounded-lg break-all">https://your-orchid-url/api/channels/webhook/telegram</code>
            <p className="text-sm text-muted">Running locally? Use <strong className="text-foreground">ngrok</strong>:</p>
            <code className="block text-xs bg-accent-soft p-3 rounded-lg">ngrok http 8000</code>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)}>Skip →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Route Messages</h3>
            <p className="text-sm text-muted">When a user messages this bot, trigger:</p>
            {wfLoading ? (
              <SkeletonRow />
            ) : (
              <Select value={workflowId} onChange={(e) => setWorkflowId(e.target.value)}
                options={[{ value: "", label: "Select workflow..." }, ...(workflows?.map((w) => ({ value: w.id, label: w.name })) ?? [])]}
              />
            )}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleFinish} loading={saving} disabled={!botToken}>Finish Setup</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
