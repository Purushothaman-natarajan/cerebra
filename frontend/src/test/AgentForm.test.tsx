/** Tests for AgentForm component. */

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import AgentForm from "@/components/AgentBuilder/AgentForm"

// Mock the API hooks
vi.mock("@/api/providers", () => ({
  useProviders: vi.fn().mockReturnValue({
    data: [
      { id: "prov-1", name: "Test Provider", provider_type: "openai", base_url: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4o-mini"], is_active: true },
    ],
  }),
  useAvailableModels: vi.fn().mockReturnValue({
    data: [
      { model: "gpt-4o", provider_name: "Test Provider", provider_type: "openai", provider_id: "prov-1" },
      { model: "gpt-4o-mini", provider_name: "Test Provider", provider_type: "openai", provider_id: "prov-1" },
    ],
  }),
}))

vi.mock("@/api/tools", () => ({
  useAgentTools: vi.fn().mockReturnValue({
    data: [
      { name: "web_search", description: "Search the web", is_builtin: true },
      { name: "calculator", description: "Calculate expressions", is_builtin: true },
    ],
  }),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe("AgentForm", () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all form fields", () => {
    renderWithProviders(<AgentForm onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByText("New Agent")).toBeTruthy()
    expect(screen.getByText("Name")).toBeTruthy()
    expect(screen.getByText("Role")).toBeTruthy()
    expect(screen.getByText("System Prompt")).toBeTruthy()
    expect(screen.getByText("Provider")).toBeTruthy()
    expect(screen.getByText("Model")).toBeTruthy()
  })

  it("calls onSave when form is submitted with valid data", () => {
    renderWithProviders(<AgentForm onSave={onSave} onCancel={onCancel} />)

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Agent" } })
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "tester" } })
    fireEvent.change(screen.getByLabelText("System Prompt"), { target: { value: "You are a test agent." } })

    // Select a provider
    const providerSelect = screen.getByLabelText("Provider")
    fireEvent.change(providerSelect, { target: { value: "prov-1" } })

    // Select a model
    const modelSelect = screen.getByLabelText("Model")
    fireEvent.change(modelSelect, { target: { value: "gpt-4o" } })

    // Submit form
    const form = screen.getByText("New Agent").closest("form")
    if (form) fireEvent.submit(form)

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: "Test Agent",
      role: "tester",
      model: "gpt-4o",
    }))
  })

  it("calls onCancel when cancel button clicked", () => {
    renderWithProviders(<AgentForm onSave={onSave} onCancel={onCancel} />)
    fireEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalled()
  })

  it("pre-fills fields when initial data provided", () => {
    renderWithProviders(
      <AgentForm
        initial={{
          name: "Pre-filled Agent",
          role: "assistant",
          system_prompt: "Pre-filled prompt",
          model: "",
          tools: [],
          memory_enabled: false,
          max_iterations: 10,
          guardrails: { blocked_topics: [], max_tokens: 4096 },
        }}
        onSave={onSave}
        onCancel={onCancel}
      />
    )
    expect(screen.getByDisplayValue("Pre-filled Agent")).toBeTruthy()
    expect(screen.getByDisplayValue("Pre-filled prompt")).toBeTruthy()
  })
})
