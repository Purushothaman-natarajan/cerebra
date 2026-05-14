/** Theme context — light/dark/system with 6 accent colors, persisted to localStorage. */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"
type Accent = "blue" | "purple" | "emerald" | "amber" | "rose" | "cyan"

interface ThemeContextType {
  theme: Theme
  accent: Accent
  resolvedTheme: "light" | "dark"
  setTheme: (t: Theme) => void
  setAccent: (a: Accent) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const ACCENTS: Accent[] = ["blue", "purple", "emerald", "amber", "rose", "cyan"]

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("cerebra-theme")
    return (saved === "dark" || saved === "light" || saved === "system") ? saved : "system"
  })
  const [accent, setAccentState] = useState<Accent>(() => {
    const saved = localStorage.getItem("cerebra-accent")
    return ACCENTS.includes(saved as Accent) ? (saved as Accent) : "blue"
  })

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme)
    localStorage.setItem("cerebra-theme", theme)
  }, [theme, resolvedTheme])

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent)
    localStorage.setItem("cerebra-accent", accent)
  }, [accent])

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      document.documentElement.setAttribute("data-theme", getSystemTheme())
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  const setAccent = (a: Accent) => setAccentState(a)

  return (
    <ThemeContext.Provider value={{ theme, accent, resolvedTheme, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

export type { Theme, Accent }
