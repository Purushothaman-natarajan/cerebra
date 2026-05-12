import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "./cn"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            error ? "border-rose-500 focus:ring-rose-500" : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export default Input
