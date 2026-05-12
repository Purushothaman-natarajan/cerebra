import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"
type Accent = "blue" | "purple" | "emerald" | "amber" | "rose" | "cyan"

interface ThemeContextType {
  theme: Theme
  accent: Accent
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  setAccent: (a: Accent) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const ACCENTS: Accent[] = ["blue", "purple", "emerald", "amber", "rose", "cyan"]

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("cerebra-theme")
    return (saved === "dark" || saved === "light") ? saved : "light"
  })
  const [accent, setAccentState] = useState<Accent>(() => {
    const saved = localStorage.getItem("cerebra-accent")
    return ACCENTS.includes(saved as Accent) ? (saved as Accent) : "blue"
  })

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("cerebra-theme", theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent)
    localStorage.setItem("cerebra-accent", accent)
  }, [accent])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggleTheme = () => setThemeState((p) => (p === "light" ? "dark" : "light"))
  const setAccent = (a: Accent) => setAccentState(a)

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, toggleTheme, setAccent }}>
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
