/** Small contextual help icon that opens a popover with page instructions. */

import { useState, useRef, useEffect } from "react"
import { HelpCircle, X } from "lucide-react"

interface HelpButtonProps {
  title: string
  steps: string[]
}

export default function HelpButton({ title, steps }: HelpButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-soft transition-colors"
        title={`Help: ${title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 p-4 rounded-xl border border-border bg-card shadow-xl z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded text-muted hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[10px] font-semibold">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
