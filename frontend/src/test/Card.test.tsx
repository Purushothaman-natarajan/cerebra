import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Card from "../components/ui/Card"

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Content</Card>)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("applies glass class", () => {
    render(<Card glass>Glass</Card>)
    expect(screen.getByText("Glass").className).toContain("glass")
  })

  it("applies hover class", () => {
    render(<Card hover>Hover</Card>)
    expect(screen.getByText("Hover").className).toContain("hover")
  })
})
