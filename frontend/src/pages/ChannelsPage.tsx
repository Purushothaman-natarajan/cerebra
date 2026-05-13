import { useState } from "react"
import { apiFetch } from "../api/client"

export default function ChannelsPage() {
  const [token, setToken] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSave = async () => {
    if (!token) {
      setMessage({ type: "error", text: "Bot token is required" })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await apiFetch("/channels", {
        method: "POST",
        body: JSON.stringify({
          name: "Telegram",
          type: "telegram",
          config: { bot_token: token, webhook_url: webhookUrl },
        }),
      })
      setMessage({ type: "success", text: "Telegram channel configured successfully" })
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to save" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Channels</h1>

      <div className="border rounded-lg p-6 bg-white dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">Telegram</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Connect a Telegram bot to let users interact with your agents via chat.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Bot Token</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Webhook URL</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="https://your-domain.com/webhook/telegram"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <h3 className="font-medium mb-2">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Create a bot via <a href="https://t.me/BotFather" className="text-blue-600" target="_blank">@BotFather</a> on Telegram</li>
          <li>Copy the bot token and paste it above</li>
          <li>Run ngrok locally: <code className="bg-gray-100 px-1">ngrok http 8000</code></li>
          <li>Set the webhook URL to <code className="bg-gray-100 px-1">https://your-ngrok.ngrok.io/webhook/telegram</code></li>
          <li>Set <code className="bg-gray-100 px-1">TELEGRAM_BOT_TOKEN</code> and <code className="bg-gray-100 px-1">TELEGRAM_WEBHOOK_URL</code> in your .env</li>
        </ol>
      </div>
    </div>
  )
}
