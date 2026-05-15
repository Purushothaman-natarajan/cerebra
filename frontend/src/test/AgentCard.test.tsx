/** Tests for AgentCard component. */

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, vi } from "vitest"
import AgentCard from "@/components/AgentBuilder/AgentCard"

describe("AgentCard", () => {
  const agent = {
    id: "agent-1",
    name: "Test Agent",
    role: "assistant",
    system_prompt: "You are a helpful assistant.",
    model: "gpt-4o",
    tools: ["web_search", "calculator"],
    channel_id: null,
    memory_enabled: false,
    max_iterations: 10,
    guardrails: { blocked_topics: [], max_tokens: 4096 },
    created_at: "2026-05-14T12:00:00Z",
    updated_at: "2026-05-14T12:00:00Z",
  }

  const defaultProps = {
    agent,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDownload: vi.fn(),
    onTest: vi.fn(),
  }

  it("renders agent name", () => {
    render(<AgentCard {...defaultProps} />)
    expect(screen.getByText("Test Agent")).toBeTruthy()
  })

  it("renders role badge", () => {
    render(<AgentCard {...defaultProps} />)
    expect(screen.getByText("assistant")).toBeTruthy()
  })

  it("renders tool badges", () => {
    render(<AgentCard {...defaultProps} />)
    expect(screen.getByText("web_search")).toBeTruthy()
    expect(screen.getByText("calculator")).toBeTruthy()
  })

  it("renders model name", () => {
    render(<AgentCard {...defaultProps} />)
    expect(screen.getByText("gpt-4o")).toBeTruthy()
  })

  it("calls onEdit when edit button clicked", () => {
    render(<AgentCard {...defaultProps} />)
    const editBtn = screen.getByTitle("Edit")
    fireEvent.click(editBtn)
    expect(defaultProps.onEdit).toHaveBeenCalled()
  })

  it("calls onTest when test button clicked", () => {
    render(<AgentCard {...defaultProps} />)
    const testBtn = screen.getByTitle("Test Agent")
    fireEvent.click(testBtn)
    expect(defaultProps.onTest).toHaveBeenCalled()
  })

  it("calls onDelete when delete button clicked", () => {
    render(<AgentCard {...defaultProps} />)
    const deleteBtn = screen.getByTitle("Delete")
    fireEvent.click(deleteBtn)
    expect(defaultProps.onDelete).toHaveBeenCalled()
  })

  it("renders system prompt preview", () => {
    render(<AgentCard {...defaultProps} />)
    // Prompt is rendered with quotes and italic: "You are a helpful assistant."
    expect(screen.getByText(/"You are a helpful assistant."/)).toBeTruthy()
  })
})
