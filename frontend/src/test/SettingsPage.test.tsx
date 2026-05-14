/** Tests for the SettingsPage — theme toggles, notification switches, cost defaults, danger zone. */

import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/contexts/ThemeContext"
import SettingsPage from "@/pages/SettingsPage"

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ThemeProvider>
          {ui}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe("SettingsPage", () => {
  it("renders all sections", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText("General")).toBeInTheDocument()
    expect(screen.getByText("Cost Defaults (per 1M tokens, USD)")).toBeInTheDocument()
    expect(screen.getByText("Notifications")).toBeInTheDocument()
    expect(screen.getByText("Security")).toBeInTheDocument()
    expect(screen.getByText("Danger Zone")).toBeInTheDocument()
  })

  it("renders theme buttons", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText("Light")).toBeInTheDocument()
    expect(screen.getByText("Dark")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument()
  })

  it("renders notification toggles", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText("Notify on run failure")).toBeInTheDocument()
    expect(screen.getByText("Notify on run complete")).toBeInTheDocument()
  })

  it("renders danger zone with clear keys, export and reset", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText("Clear All API Keys")).toBeInTheDocument()
    expect(screen.getByText("Export / Import Settings")).toBeInTheDocument()
    expect(screen.getByText("Reset Platform")).toBeInTheDocument()
  })

  it("renders platform name input", () => {
    renderWithProviders(<SettingsPage />)
    const input = screen.getByLabelText("Platform Name")
    expect(input).toHaveValue("Cerebra-AI")
  })

  it("renders cost default model pricing table", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText("gemini-2.0-flash")).toBeInTheDocument()
    expect(screen.getByText("gpt-4o")).toBeInTheDocument()
  })

  it("renders security encryption info", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText(/Fernet/)).toBeInTheDocument()
    expect(screen.getByText(/PBKDF2/)).toBeInTheDocument()
  })
})
