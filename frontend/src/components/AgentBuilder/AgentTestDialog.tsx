/** Test agent dialog — input sample message, execute, see response with tokens/cost/timing. */

import { useState } from "react"
import { Button, Dialog, Input, Textarea } from "@/components/ui"
import { Bot, Clock, CheckCircle, XCircle } from "lucide-react"
import { testAgent } from "@/api/agents"

interface TestResult {
  ok: boolean
  output: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number
  duration_ms: number
}

interface Props {
  agentName: string
  agentId: string
  open: boolean
  onClose: () => void
}

export default function AgentTestDialog({ agentName, agentId, open, onClose }: Props) {
  const [input, setInput] = useState("")
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const handleTest = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await testAgent(agentId, input)
      setResult(res)
    } catch (e) {
      setResult({ ok: false, output: e instanceof Error ? e.message : "Request failed", prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0, duration_ms: 0 })
    }
    setRunning(false)
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Test: ${agentName}`} className="max-w-xl">
      <div className="space-y-4">
        <Input
          label="Sample Input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a test message for the agent..."
        />
        <Button onClick={handleTest} loading={running} className="gap-2">
          <Bot className="w-4 h-4" /> Run Test
        </Button>

        {result && (
          <div className={`p-4 rounded-xl border ${result.ok ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20" : "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20"}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.ok
                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                : <XCircle className="w-5 h-5 text-rose-500" />
              }
              <span className={`text-sm font-medium ${result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                {result.ok ? "Success" : "Failed"}
              </span>
              <span className="text-xs text-muted flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" /> {result.duration_ms}ms
              </span>
            </div>
            <Textarea
              value={result.output}
              readOnly
              rows={4}
              className="text-xs font-mono"
            />
            {result.total_tokens > 0 && (
              <p className="text-[10px] text-muted mt-2">
                {result.total_tokens} tokens · ${result.cost.toFixed(6)}
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}