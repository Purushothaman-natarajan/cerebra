/** Node config side panel — appears when a node is clicked on the canvas. */

import type { Node } from "reactflow"
import { X, Bot, GitFork, UserCheck, LogOut, StickyNote } from "lucide-react"
import { Input, Textarea, Select } from "@/components/ui"

interface Props {
  node: Node | null
  onClose: () => void
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void
}

const nodeIcons: Record<string, typeof Bot> = {
  agent: Bot,
  router: GitFork,
  human: UserCheck,
  output: LogOut,
  note: StickyNote,
}

const nodeColors: Record<string, string> = {
  agent: "var(--accent)",
  router: "#f59e0b",
  human: "#8b5cf6",
  output: "#10b981",
  note: "#64748b",
}

export default function NodeConfigPanel({ node, onClose, onUpdate }: Props) {
  if (!node) return null

  const Icon = nodeIcons[node.type as string] || Bot
  const color = nodeColors[node.type as string] || "var(--accent)"
  const d = node.data as Record<string, unknown>

  const update = (key: string, value: unknown) => {
    onUpdate(node.id, { ...d, [key]: value })
  }

  return (
    <div className="w-80 border-l border-border bg-card overflow-y-auto animate-in slide-in-from-right shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: color }}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-medium text-foreground capitalize">{node.type} Node</span>
            <p className="text-[10px] text-muted">{node.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent-soft transition-colors">
          <X className="w-4 h-4 text-muted" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <Input label="Node Label" value={(d.label as string) || ""} onChange={(e) => update("label", e.target.value)} placeholder="My Node" />

        {node.type === "agent" && (
          <>
            <Textarea label="System Prompt" value={(d.system_prompt as string) || ""} onChange={(e) => update("system_prompt", e.target.value)} rows={4} placeholder="You are a helpful assistant..." />
            <Input label="Model" value={(d.model as string) || "gemini-2.0-flash"} onChange={(e) => update("model", e.target.value)} placeholder="gemini-2.0-flash" />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Tools</label>
              <div className="flex flex-wrap gap-1.5">
                {["web_search", "calculator", "http_request", "web_crawler"].map((t) => {
                  const tools = (d.tools as string[]) || []
                  const active = tools.includes(t)
                  return (
                    <button key={t} onClick={() => update("tools", active ? tools.filter((x: string) => x !== t) : [...tools, t])}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                        active ? "text-white" : "border-border text-muted hover:bg-accent-soft"
                      }`}
                      style={active ? { background: "var(--accent)", borderColor: "var(--accent)" } : {}}
                    >{t}</button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {node.type === "router" && (
          <>
            <p className="text-xs text-muted">Route based on conditions. Configure conditions in the workflow definition.</p>
          </>
        )}

        {node.type === "human" && (
          <>
            <p className="text-xs text-muted">Pauses the workflow and waits for human approval before continuing.</p>
            <Input label="Approval Prompt" value={(d.approval_prompt as string) || ""} onChange={(e) => update("approval_prompt", e.target.value)} placeholder="Review the output and approve..." />
            <Select label="On Reject" value={(d.on_reject as string) || "stop"} onChange={(e) => update("on_reject", e.target.value)}
              options={[{ value: "stop", label: "Stop workflow" }, { value: "continue", label: "Continue with note" }, { value: "retry", label: "Retry agent" }]}
            />
          </>
        )}

        {node.type === "output" && (
          <>
            <p className="text-xs text-muted">Sends the workflow output to a destination.</p>
            <Select label="Output Type" value={(d.output_type as string) || "return"} onChange={(e) => update("output_type", e.target.value)}
              options={[{ value: "return", label: "Return result" }, { value: "channel", label: "Send to channel" }, { value: "log", label: "Log only" }]}
            />
          </>
        )}

        {node.type === "note" && (
          <>
            <Textarea label="Note Content" value={(d.content as string) || ""} onChange={(e) => update("content", e.target.value)} rows={4} placeholder="Documentation for this workflow..." />
          </>
        )}
      </div>
    </div>
  )
}
