/** Tests for the SettingsPage — theme toggles, notification switches, danger zone. */

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
    expect(screen.getByText("Execution Defaults")).toBeInTheDocument()
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

  it("renders danger zone with export and reset", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByText("Export All Data")).toBeInTheDocument()
    expect(screen.getByText("Reset Platform")).toBeInTheDocument()
  })

  it("renders platform name input", () => {
    renderWithProviders(<SettingsPage />)
    const input = screen.getByLabelText("Platform Name")
    expect(input).toHaveValue("Cerebra-AI")
  })

  it("renders execution default inputs", () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByLabelText("Default Timeout (s)")).toHaveValue(60)
    expect(screen.getByLabelText("Max Iterations")).toHaveValue(10)
    expect(screen.getByLabelText("Token Budget")).toHaveValue(10000)
  })
})
