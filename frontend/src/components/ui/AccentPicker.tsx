import { useTheme } from "@/contexts/ThemeContext"
import type { Accent } from "@/contexts/ThemeContext"

const ACCENTS: { value: Accent; label: string; color: string }[] = [
  { value: "blue", label: "Blue", color: "#3b82f6" },
  { value: "purple", label: "Purple", color: "#8b5cf6" },
  { value: "emerald", label: "Emerald", color: "#10b981" },
  { value: "amber", label: "Amber", color: "#f59e0b" },
  { value: "rose", label: "Rose", color: "#f43f5e" },
  { value: "cyan", label: "Cyan", color: "#06b6d4" },
]

export default function AccentPicker() {
  const { accent, setAccent } = useTheme()

  return (
    <div className="flex items-center gap-1.5">
      {ACCENTS.map((a) => (
        <button
          key={a.value}
          onClick={() => setAccent(a.value)}
          className={`w-4 h-4 rounded-full transition-all ${
            accent === a.value
              ? "ring-2 ring-offset-1 ring-offset-transparent scale-110"
              : "opacity-60 hover:opacity-100"
          }`}
          style={{ backgroundColor: a.color, outline: accent === a.value ? `2px solid ${a.color}` : undefined, outlineOffset: 2 }}
          title={a.label}
        />
      ))}
    </div>
  )
}
