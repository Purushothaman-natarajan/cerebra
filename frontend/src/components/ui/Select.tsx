import { forwardRef, type SelectHTMLAttributes } from "react"
import { cn } from "./cn"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string; group?: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-")
    const groups = groupBy(options, "group")

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
            error ? "border-rose-500" : "border-border",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {Object.entries(groups).map(([group, opts]) =>
            group === "undefined" ? (
              opts.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))
            ) : (
              <optgroup key={group} label={group}>
                {opts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
            )
          )}
        </select>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"

function groupBy<T extends { group?: string }>(arr: T[], key: keyof T): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const item of arr) {
    const k = String(item[key] ?? "undefined")
    if (!map[k]) map[k] = []
    map[k].push(item)
  }
  return map
}

export default Select
