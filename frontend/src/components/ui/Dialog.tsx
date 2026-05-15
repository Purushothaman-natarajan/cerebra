/** Accessible dialog/modal with animations, focus trap, body scroll lock, and close button. */

import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "./cn"

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export default function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      previousFocus.current?.focus()
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current()
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    if (open) {
      document.addEventListener("keydown", handler)
    }
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  // Auto-focus first button when dialog opens — isolated effect so parent re-renders
  // (which recreate onClose) do not cause focus-stealing on every keystroke.
  useEffect(() => {
    if (open) {
      setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("button")?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={cn(
          "bg-card border border-border rounded-2xl shadow-strong max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-right",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            <h3 id="dialog-title" className="text-lg font-semibold text-foreground">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent-soft transition-colors text-muted hover:text-foreground" aria-label="Close dialog">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className={cn("p-6", !title && "pt-6")}>{children}</div>
      </div>
    </div>
  )
}
