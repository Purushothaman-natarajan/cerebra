/** Channels page — 3-step Telegram wizard with connection test, ngrok auto-config, existing channel list, and delete. */

import { useState } from "react"
import { useChannels, useDeleteChannel, useCreateChannel } from "@/api/channels"
import type { Channel } from "@/api/channels"
import { useWorkflows } from "@/api/workflows"
import { testChannelToken } from "@/api/channels"
import type { ChannelFormData } from "@/api/channels"
import { Button, Card, Input, Select, Dialog, SkeletonRow } from "@/components/ui"
import StepIndicator from "@/components/ui/StepIndicator"
import { Radio, Send, Webhook, Route, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react"

const steps = [
  { label: "Create Bot", icon: Send },
  { label: "Webhook", icon: Webhook },
  { label: "Route", icon: Route },
]

export default function ChannelsPage() {
  const { data: channels, isLoading: chLoading } = useChannels()
  const { data: workflows, isLoading: wfLoading } = useWorkflows()
  const createChannel = useCreateChannel()
  const deleteChannel = useDeleteChannel()

  const [step, setStep] = useState(0)
  const [botToken, setBotToken] = useState("")
  const [ngrokUrl, setNgrokUrl] = useState("")
  const [workflowId, setWorkflowId] = useState("")
  const [showWizard, setShowWizard] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [tokenVerified, setTokenVerified] = useState(false)

  const handleTest = async () => {
    if (!botToken) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testChannelToken(botToken)
      if (res.ok) {
        setTestResult({ ok: true, msg: `Connected! Bot: @${res.username || "unknown"}` })
        setTokenVerified(true)
      } else {
        setTestResult({ ok: false, msg: `Token rejected: ${res.description || "Unknown error"}` })
        setTokenVerified(false)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed"
      setTestResult({ ok: false, msg })
      setTokenVerified(false)
    }
    setTesting(false)
  }

  const handleFinish = () => {
    if (!botToken) return
    const config: Record<string, unknown> = { bot_token: botToken }
    if (ngrokUrl) config.webhook_url = ngrokUrl
    if (workflowId) config.workflow_id = workflowId
    createChannel.mutate(
      { name: "Telegram", type: "telegram", config } as ChannelFormData,
      {
        onSuccess: () => {
          setShowWizard(false)
          setStep(0)
          setTestResult(null)
          setTokenVerified(false)
        },
      }
    )
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

      {/* Existing channels list */}
      {chLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : channels && channels.length > 0 ? (
        <div className="space-y-3">
          {channels.map((ch: Channel) => (
            <Card key={ch.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-soft shrink-0" style={{ color: "var(--accent)" }}>
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-medium text-foreground text-sm">{ch.name}</span>
                  <p className="text-xs text-muted">
                    {ch.type} · Created {new Date(ch.created_at).toLocaleDateString()}
                    {ch.config?.workflow_id ? " · Workflow bound" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this channel?")) deleteChannel.mutate(ch.id) }} className="text-rose-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Add Channel button (if no channels exist) */}
      {!chLoading && (!channels || channels.length === 0) && (
        <Card hover className="border-dashed flex items-center justify-center min-h-[120px] cursor-pointer p-4" onClick={() => setShowWizard(true)}>
          <div className="text-center">
            <Radio className="w-6 h-6 text-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-muted">Connect a Telegram bot</p>
            <p className="text-xs text-muted mt-1">Receive messages and trigger workflows</p>
          </div>
        </Card>
      )}

      <Dialog open={showWizard} onClose={() => setShowWizard(false)} title="Connect Telegram" className="max-w-lg">
        <StepIndicator steps={steps} current={step} />

        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Create a Telegram Bot</h3>
            <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
              <li>Open Telegram and search for <strong className="text-foreground">@BotFather</strong></li>
              <li>Send: <code className="bg-accent-soft px-1.5 py-0.5 rounded text-xs">/newbot</code></li>
              <li>Name your bot, then copy the API token</li>
            </ol>
            <Input label="Bot Token" value={botToken} onChange={(e) => { setBotToken(e.target.value); setTokenVerified(false); setTestResult(null) }} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleTest} loading={testing} disabled={!botToken}>
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Test Connection
              </Button>
              {testResult && (
                <div className={`flex items-center gap-1.5 text-sm ${testResult.ok ? "text-emerald-600" : "text-rose-600"}`}>
                  {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="text-xs">{testResult.msg}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!tokenVerified}>Next →</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Configure Webhook (Automatic)</h3>
            <p className="text-sm text-muted">
              For local development, start <strong className="text-foreground">ngrok</strong>:
            </p>
            <code className="block text-xs bg-accent-soft p-3 rounded-lg">ngrok http 8000</code>
            <Input
              label="ngrok HTTPS URL"
              value={ngrokUrl}
              onChange={(e) => setNgrokUrl(e.target.value)}
              placeholder="https://your-ngrok-url.ngrok.dev"
            />
            <p className="text-xs text-muted">
              Full path: <code className="bg-accent-soft px-1 py-0.5 rounded">{ngrokUrl || "https://your-url"}/api/channels/webhook/telegram</code>
            </p>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)}>{ngrokUrl ? "Next →" : "Skip →"}</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Route Messages</h3>
            <p className="text-sm text-muted">When a user messages this bot, trigger:</p>
            {wfLoading ? <SkeletonRow /> : (
              <Select value={workflowId} onChange={(e) => setWorkflowId(e.target.value)}
                options={[{ value: "", label: "Select workflow..." }, ...(workflows?.map((w) => ({ value: w.id, label: w.name })) ?? [])]}
              />
            )}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleFinish} loading={createChannel.isPending} disabled={!botToken || !tokenVerified}>
                {createChannel.isPending ? "Setting up..." : "Finish Setup"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
