/** Tests for Textarea component. */

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, vi } from "vitest"
import Textarea from "@/components/ui/Textarea"

describe("Textarea", () => {
  it("renders with label", () => {
    render(<Textarea label="Description" />)
    expect(screen.getByLabelText("Description")).toBeTruthy()
  })

  it("renders with placeholder", () => {
    render(<Textarea label="Description" placeholder="Enter description..." />)
    expect(screen.getByPlaceholderText("Enter description...")).toBeTruthy()
  })

  it("calls onChange when typing", () => {
    const onChange = vi.fn()
    render(<Textarea label="Description" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Hello" } })
    expect(onChange).toHaveBeenCalled()
  })

  it("applies custom class name", () => {
    const { container } = render(<Textarea label="Description" className="custom-class" />)
    const textarea = container.querySelector("textarea")
    expect(textarea?.className).toContain("custom-class")
  })

  it("renders as disabled", () => {
    render(<Textarea label="Description" disabled />)
    const textarea = screen.getByLabelText("Description") as HTMLTextAreaElement
    expect(textarea.disabled).toBe(true)
  })

  it("displays initial value", () => {
    render(<Textarea label="Description" value="Initial text" readOnly />)
    const textarea = screen.getByLabelText("Description") as HTMLTextAreaElement
    expect(textarea.value).toBe("Initial text")
  })
})
