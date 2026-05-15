/** Tests for LiveLogs component. */

import { render, screen } from "@testing-library/react"
import { describe, it, vi, beforeEach } from "vitest"
import LiveLogs from "@/components/MonitorPanel/LiveLogs"

// Mock apiFetch to prevent real network calls
vi.mock("@/api/client", () => ({
  apiFetch: vi.fn().mockResolvedValue([]),
}))

describe("LiveLogs", () => {
  beforeEach(() => {
    // Mock scrollIntoView on all elements
    Element.prototype.scrollIntoView = vi.fn()

    // Mock WebSocket as a proper constructor
    class MockWebSocket {
      close = vi.fn()
      send = vi.fn()
      addEventListener = vi.fn()
      removeEventListener = vi.fn()
      onopen: (() => void) | null = null
      onclose: (() => void) | null = null
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: (() => void) | null = null
      readyState = MockWebSocket.CONNECTING
      static CONNECTING = 0
      static OPEN = 1
      static CLOSING = 2
      static CLOSED = 3
    }
    window.WebSocket = MockWebSocket as unknown as typeof WebSocket
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders with run ID", () => {
    render(<LiveLogs runId="test-run-123" />)
    expect(screen.getByText("Waiting for events...")).toBeTruthy()
  })

  it("shows disconnected state initially", () => {
    render(<LiveLogs runId="test-run-123" />)
    expect(screen.getByText("Disconnected")).toBeTruthy()
  })

  it("shows event count", () => {
    render(<LiveLogs runId="test-run-123" />)
    expect(screen.getByText("0 events")).toBeTruthy()
  })
})
