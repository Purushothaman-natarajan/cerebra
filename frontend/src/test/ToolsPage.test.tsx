/** Tests for the ToolsPage — built-in tools, custom tools, test dialog, export/import. */

import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { ToastProvider } from "@/components/ui/Toast"
import ToolsPage from "@/pages/ToolsPage"

vi.mock("@/api/client", () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from "@/api/client"

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            {ui}
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe("ToolsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("renders the page heading", async () => {
    ;(apiFetch as Mock).mockResolvedValue([])
    renderWithProviders(<ToolsPage />)
    await waitFor(() => {
      expect(screen.getByText(/Tools/)).toBeInTheDocument()
    })
  })

  it("renders the custom tools section heading", async () => {
    ;(apiFetch as Mock).mockResolvedValue([])
    renderWithProviders(<ToolsPage />)
    await waitFor(() => {
      expect(screen.getByText("Custom Tools")).toBeInTheDocument()
    })
  })

  it("renders the add custom tool button", async () => {
    ;(apiFetch as Mock).mockResolvedValue([])
    renderWithProviders(<ToolsPage />)
    await waitFor(() => {
      expect(screen.getByText("+ Create Tool")).toBeInTheDocument()
    })
  })

  it("renders the built-in tools section heading", async () => {
    const builtinTools = [
      { name: "web_search", description: "Search the web", tool_type: "builtin", is_builtin: true },
      { name: "calculator", description: "Calculate", tool_type: "builtin", is_builtin: true },
    ]
    ;(apiFetch as Mock).mockImplementation((url: string) => {
      if (url === "/tools") return Promise.resolve(builtinTools)
      return Promise.resolve([])
    })
    renderWithProviders(<ToolsPage />)
    await waitFor(() => {
      expect(screen.getByText("Built-in Tools")).toBeInTheDocument()
    })
  })

  it("shows the empty state when no custom tools", async () => {
    ;(apiFetch as Mock).mockResolvedValue([])
    renderWithProviders(<ToolsPage />)
    await waitFor(() => {
      expect(screen.getByText(/No custom tools yet/)).toBeInTheDocument()
    })
  })
})
