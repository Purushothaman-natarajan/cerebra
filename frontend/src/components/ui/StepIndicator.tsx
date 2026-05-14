/** Step progress indicator for wizards — step number, icon, label, connecting line. */

import { cn } from "./cn"
import type { LucideIcon } from "lucide-react"

interface Step {
  label: string
  icon: LucideIcon
}

interface Props {
  steps: Step[]
  current: number
  className?: string
}

export default function StepIndicator({ steps, current, className }: Props) {
  return (
    <div className={cn("flex items-center gap-2 mb-6", className)}>
      {steps.map((s, i) => {
        const Icon = s.icon
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0",
              active ? "bg-accent text-white" : done ? "bg-accent text-white" : "bg-accent-soft text-muted"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={cn(
              "text-xs font-medium hidden sm:block truncate",
              active ? "text-foreground" : done ? "text-foreground" : "text-muted"
            )}>{s.label}</span>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-px hidden sm:block", i < current ? "bg-accent" : "bg-border")} />
            )}
          </div>
        )
      })}
    </div>
  )
}
