/** Button component — 5 variants, 3 sizes, loading state, theme-aware, smart hover effects. */

import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "./cn"
import { Loader2 } from "lucide-react"

const variants = {
  primary: "text-white hover:opacity-90 shadow-sm hover:shadow-md active:scale-[0.97]",
  secondary: "bg-card border border-border text-foreground hover:bg-accent-soft hover:border-accent/30 active:scale-[0.97]",
  ghost: "text-muted hover:text-foreground hover:bg-accent-soft active:scale-[0.97]",
  danger: "text-white hover:opacity-90 shadow-sm active:scale-[0.97]",
  outline: "border border-border bg-transparent text-foreground hover:bg-accent-soft hover:border-accent/30 active:scale-[0.97]",
}

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-2.5 text-base rounded-xl",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
        "disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className
      )}
      style={
        variant === "primary" ? { background: "var(--accent)" } :
        variant === "danger" ? { background: "var(--error)" } :
        undefined
      }
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = "Button"

export default Button
