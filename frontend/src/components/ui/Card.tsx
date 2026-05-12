import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "./cn"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, glass, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        glass && "glass",
        hover && "transition-all duration-200 hover:shadow-strong hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = "Card"

export default Card
