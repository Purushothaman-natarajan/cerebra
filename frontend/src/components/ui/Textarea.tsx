/** Textarea component with auto-resize — grows smoothly as user types. */

import { forwardRef, useEffect, useRef, type TextareaHTMLAttributes } from "react"
import { cn } from "./cn"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, value, onChange, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-")
    const innerRef = useRef<HTMLTextAreaElement | null>(null)

    // Auto-resize: grow height as content grows
    useEffect(() => {
      const el = innerRef.current
      if (!el) return
      el.style.height = "auto"
      el.style.height = `${Math.max(el.scrollHeight, 40)}px`
    }, [value])

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={(node) => {
            innerRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
          }}
          id={textareaId}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder-muted transition-colors resize-none min-h-[40px]",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            error ? "border-rose-500" : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export default Textarea
