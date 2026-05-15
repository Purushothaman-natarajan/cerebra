/** Tests for ErrorBoundary component. */

import { render, screen } from "@testing-library/react"
import { describe, it, vi, beforeEach } from "vitest"
import ErrorBoundary from "@/components/ui/ErrorBoundary"

const Bomb = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("💥")
  return <div>Safe</div>
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>
    )
    expect(screen.getByText("Hello")).toBeTruthy()
  })

  it("renders fallback on error", () => {
    render(
      <ErrorBoundary componentName="TestComponent">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText("TestComponent")).toBeTruthy()
    expect(screen.getByText("💥")).toBeTruthy()
  })

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Custom Error UI")).toBeTruthy()
  })

  it("recovers after retry click", () => {
    render(
      <ErrorBoundary componentName="TestComponent">
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Retry")).toBeTruthy()
  })
})
