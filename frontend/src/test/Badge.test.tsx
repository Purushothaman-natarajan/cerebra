import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Badge from "@/components/ui/Badge"

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })
  it("applies variant classes", () => {
    render(<Badge variant="success">Done</Badge>)
    expect(screen.getByText("Done").className).toContain("emerald")
  })
})
