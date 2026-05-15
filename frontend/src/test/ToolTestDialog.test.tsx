/** Tests for ToolTestDialog component. */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, vi, beforeEach } from "vitest"
import ToolTestDialog from "@/components/ToolBuilder/ToolTestDialog"

const mockFetch = vi.fn()

vi.mock("@/api/client", () => ({
  apiFetch: (...args: unknown[]) => mockFetch(...args),
}))

describe("ToolTestDialog", () => {
  const defaultProps = {
    toolId: "calculator",
    toolName: "Calculator",
    isBuiltin: true,
    open: true,
    onClose: vi.fn(),
    initialInput: "2 + 2",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders with tool name in title", () => {
    render(<ToolTestDialog {...defaultProps} />)
    expect(screen.getByText("Test: Calculator")).toBeTruthy()
  })

  it("shows sample input field", () => {
    render(<ToolTestDialog {...defaultProps} />)
    const input = screen.getByLabelText("Sample Input") as HTMLInputElement
    expect(input.value).toBe("2 + 2")
  })

  it("calls apiFetch on Run Test click", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, output: "4", duration_ms: 5 })
    render(<ToolTestDialog {...defaultProps} />)

    fireEvent.click(screen.getByText("Run Test"))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/tools/test",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("calculator"),
        })
      )
    })
  })

  it("displays success result", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, output: "4", duration_ms: 5 })
    render(<ToolTestDialog {...defaultProps} />)

    fireEvent.click(screen.getByText("Run Test"))

    await waitFor(() => {
      expect(screen.getByText("Success")).toBeTruthy()
    })
  })

  it("displays failure result on API error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))
    render(<ToolTestDialog {...defaultProps} />)

    fireEvent.click(screen.getByText("Run Test"))

    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeTruthy()
    })
  })

  it("calls onClose when dialog close button clicked", () => {
    const onClose = vi.fn()
    render(<ToolTestDialog {...defaultProps} onClose={onClose} />)
    const closeButton = screen.getByLabelText("Close dialog")
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })

  it("updates input field on change", () => {
    render(<ToolTestDialog {...defaultProps} />)
    const input = screen.getByLabelText("Sample Input")
    fireEvent.change(input, { target: { value: "3 * 3" } })
    expect((input as HTMLInputElement).value).toBe("3 * 3")
  })
})
