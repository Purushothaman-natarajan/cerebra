import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "./cn"
import { Loader2 } from "lucide-react"

const variants = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-soft",
  secondary: "bg-card border border-border text-foreground hover:bg-accent-soft",
  ghost: "text-muted hover:text-foreground hover:bg-accent-soft",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  outline: "border border-border bg-transparent text-foreground hover:bg-accent-soft",
}

const sizes = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
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
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = "Button"

export default Button
