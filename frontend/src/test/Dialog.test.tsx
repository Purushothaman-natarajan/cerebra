/** Tests for Dialog component. */

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, vi } from "vitest"
import Dialog from "@/components/ui/Dialog"

describe("Dialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Dialog open={false} onClose={vi.fn()}>
        <div>Content</div>
      </Dialog>
    )
    expect(container.innerHTML).toBe("")
  })

  it("renders content when open", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test Dialog">
        <div>Dialog Content</div>
      </Dialog>
    )
    expect(screen.getByText("Dialog Content")).toBeTruthy()
    expect(screen.getByText("Test Dialog")).toBeTruthy()
  })

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose}>
        <div>Content</div>
      </Dialog>
    )
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose}>
        <div>Content</div>
      </Dialog>
    )
    // The backdrop is the outer overlay div
    const backdrop = document.querySelector(".fixed.inset-0")
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("does not close when clicking inside the dialog", () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose}>
        <div>Content</div>
      </Dialog>
    )
    const content = screen.getByText("Content")
    fireEvent.click(content)
    expect(onClose).not.toHaveBeenCalled()
  })

  it("renders close button with accessible label", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test">
        <div>Content</div>
      </Dialog>
    )
    expect(screen.getByLabelText("Close dialog")).toBeTruthy()
  })
})
