/** Test tool dialog — input sample data, execute, see output with timing.
 *  Supports both custom tools (tool_id) and built-in tools (name). */

import { useState, useEffect } from "react"
import { Button, Dialog, Input, Textarea } from "@/components/ui"
import { Play, Clock, CheckCircle, XCircle } from "lucide-react"
import { apiFetch } from "@/api/client"

interface TestResult {
  ok: boolean
  output: string
  duration_ms: number
}

interface Props {
  toolId?: string
  toolName: string
  isBuiltin?: boolean
  open: boolean
  onClose: () => void
  initialInput?: string
}

export default function ToolTestDialog({ toolId, toolName, open, onClose, initialInput = "" }: Props) {
  const [input, setInput] = useState(initialInput)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  // Reset input when dialog opens or initialInput changes
  useEffect(() => { if (open) setInput(initialInput) }, [open, initialInput])

  const handleTest = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await apiFetch<TestResult>("/tools/test", {
        method: "POST",
        body: JSON.stringify({ tool_id: toolId, input }),
      })
      setResult(res)
    } catch (e) {
      setResult({ ok: false, output: e instanceof Error ? e.message : "Request failed", duration_ms: 0 })
    }
    setRunning(false)
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Test: ${toolName}`} className="max-w-xl">
      <div className="space-y-4">
        <Input
          label="Sample Input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter test input..."
        />
        <Button onClick={handleTest} loading={running} className="gap-2">
          <Play className="w-4 h-4" /> Run Test
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
          </div>
        )}
      </div>
    </Dialog>
  )
}
