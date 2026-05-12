import { forwardRef, type TextareaHTMLAttributes } from "react"
import { cn } from "./cn"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder-muted transition-colors resize-y",
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
