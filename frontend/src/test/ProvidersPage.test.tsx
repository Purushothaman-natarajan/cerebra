/** Tests for the ProvidersPage — provider list, add dialog, test connection, presets. */

import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { ToastProvider } from "@/components/ui/Toast"
import ProvidersPage from "@/pages/ProvidersPage"

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

describe("ProvidersPage", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(apiFetch as Mock).mockResolvedValue([])
  })

  it("renders the page heading", async () => {
    renderWithProviders(<ProvidersPage />)
    expect(screen.getByText("Providers")).toBeInTheDocument()
  })

  it("renders the encrypted note", async () => {
    renderWithProviders(<ProvidersPage />)
    expect(screen.getByText(/API keys are encrypted at rest/)).toBeInTheDocument()
  })

  it("renders the add provider button", async () => {
    renderWithProviders(<ProvidersPage />)
    expect(screen.getByText("+ Add Provider")).toBeInTheDocument()
  })

  it("opens the add provider dialog when clicking the button", async () => {
    renderWithProviders(<ProvidersPage />)
    fireEvent.click(screen.getByText("+ Add Provider"))
    expect(screen.getByText("Add LLM Provider")).toBeInTheDocument()
  })

  it("renders the quick-add preset buttons", async () => {
    const mockPresets = [
      { type: "openai", label: "OpenAI", base_url: "https://api.openai.com/v1", key_hint: "sk-...", key_example: "sk-proj-abc123" },
      { type: "gemini", label: "Gemini", base_url: "https://generativelanguage.googleapis.com/v1beta", key_hint: "AIza...", key_example: "AIzaSy..." },
    ]
    ;(apiFetch as Mock).mockImplementation((url: string) => {
      if (url === "/providers/presets") return Promise.resolve(mockPresets)
      return Promise.resolve([])
    })
    renderWithProviders(<ProvidersPage />)
    fireEvent.click(screen.getByText("+ Add Provider"))
    await waitFor(() => {
      expect(screen.getByText("OpenAI")).toBeInTheDocument()
    })
  })

  it("shows the empty state when no providers", async () => {
    renderWithProviders(<ProvidersPage />)
    await waitFor(() => {
      expect(screen.getByText(/No providers yet/)).toBeInTheDocument()
    })
  })

  it("closes the dialog on cancel", async () => {
    renderWithProviders(<ProvidersPage />)
    fireEvent.click(screen.getByText("+ Add Provider"))
    fireEvent.click(screen.getByText("Cancel"))
    expect(screen.queryByText("Add LLM Provider")).not.toBeInTheDocument()
  })
})
