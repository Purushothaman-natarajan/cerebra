/** Tests for Toast provider and useToast hook. */

import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, vi, beforeEach } from "vitest"
import { ToastProvider, useToast } from "@/components/ui/Toast"

function TestConsumer() {
  const { toast } = useToast()
  return (
    <div>
      <button onClick={() => toast("success", "Success message")}>Show Success</button>
      <button onClick={() => toast("error", "Error message")}>Show Error</button>
      <button onClick={() => toast("info", "Info message")}>Show Info</button>
      <button onClick={() => toast("warning", "Warning message")}>Show Warning</button>
    </div>
  )
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it("renders children", () => {
    render(
      <ToastProvider>
        <div>App content</div>
      </ToastProvider>
    )
    expect(screen.getByText("App content")).toBeTruthy()
  })

  it("shows success toast when triggered", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText("Show Success"))
    expect(screen.getByText("Success message")).toBeTruthy()
  })

  it("shows error toast when triggered", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText("Show Error"))
    expect(screen.getByText("Error message")).toBeTruthy()
  })

  it("shows info toast when triggered", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText("Show Info"))
    expect(screen.getByText("Info message")).toBeTruthy()
  })

  it("auto-dismisses toast after timeout", () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    fireEvent.click(screen.getByText("Show Success"))
    expect(screen.getByText("Success message")).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByText("Success message")).toBeNull()
  })
})
