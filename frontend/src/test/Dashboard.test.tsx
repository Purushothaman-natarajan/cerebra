/** Tests for the Dashboard — renders welcome, stats, recent runs. */

import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/contexts/ThemeContext"
import Dashboard from "@/pages/Dashboard"

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ThemeProvider>{ui}</ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe("Dashboard", () => {
  it("renders the dashboard heading", () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("renders stat cards", () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText("Providers")).toBeInTheDocument()
    expect(screen.getByText("Agents")).toBeInTheDocument()
    expect(screen.getByText("Workflows")).toBeInTheDocument()
    expect(screen.getByText("Runs")).toBeInTheDocument()
  })

  it("renders quick actions", () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText("Add Provider")).toBeInTheDocument()
    expect(screen.getByText("New Workflow")).toBeInTheDocument()
  })

  it("shows welcome on first visit", () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText(/Welcome to/)).toBeInTheDocument()
  })
})
