import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Empty from "../components/ui/Empty"

describe("Empty", () => {
  it("renders title and description", () => {
    render(<Empty title="No data" description="Nothing here yet." />)
    expect(screen.getByText("No data")).toBeInTheDocument()
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument()
  })

  it("renders action button when provided", () => {
    render(<Empty title="Empty" action={{ label: "Create", onClick: () => {} }} />)
    expect(screen.getByText("Create")).toBeInTheDocument()
  })
})
