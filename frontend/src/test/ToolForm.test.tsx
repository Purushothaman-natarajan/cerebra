/** Tests for ToolForm component. */

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, vi } from "vitest"
import ToolForm from "@/components/ToolBuilder/ToolForm"

describe("ToolForm", () => {
  const onSave = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all form fields", () => {
    render(<ToolForm onSave={onSave} onCancel={onCancel} />)
    expect(screen.getByLabelText("Tool Name")).toBeTruthy()
    expect(screen.getByLabelText("Description")).toBeTruthy()
    expect(screen.getByLabelText("Type")).toBeTruthy()
    expect(screen.getByText("Create Tool")).toBeTruthy()
  })

  it("shows URL field when type is HTTP", () => {
    render(<ToolForm onSave={onSave} onCancel={onCancel} />)
    const typeSelect = screen.getByLabelText("Type")
    fireEvent.change(typeSelect, { target: { value: "http" } })
    expect(screen.getByLabelText("URL")).toBeTruthy()
  })

  it("calls onSave on form submit with valid data", () => {
    render(<ToolForm onSave={onSave} onCancel={onCancel} />)
    fireEvent.change(screen.getByLabelText("Tool Name"), { target: { value: "my_tool" } })
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "My custom tool" } })

    const typeSelect = screen.getByLabelText("Type")
    fireEvent.change(typeSelect, { target: { value: "http" } })

    fireEvent.change(screen.getByLabelText("URL"), { target: { value: "https://api.example.com" } })

    const methodSelect = screen.getByLabelText("Method")
    fireEvent.change(methodSelect, { target: { value: "POST" } })

    fireEvent.click(screen.getByText("Create Tool"))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: "my_tool",
      description: "My custom tool",
      tool_type: "http",
    }))
  })

  it("shows code field when type is Python", () => {
    render(<ToolForm onSave={onSave} onCancel={onCancel} />)
    const typeSelect = screen.getByLabelText("Type")
    fireEvent.change(typeSelect, { target: { value: "python" } })
    expect(screen.getByLabelText("Python Code")).toBeTruthy()
  })

  it("calls onCancel when cancel button clicked", () => {
    render(<ToolForm onSave={onSave} onCancel={onCancel} />)
    fireEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalled()
  })
})
