import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Button from "@/components/ui/Button"

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("applies variant classes", () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByText("Delete")
    expect(btn.className).toContain("rose")
  })

  it("shows loading spinner", () => {
    render(<Button loading>Loading</Button>)
    const btn = screen.getByText("Loading")
    expect(btn).toBeDisabled()
  })

  it("disables when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText("Disabled")).toBeDisabled()
  })

  it("handles click events", () => {
    let clicked = false
    render(<Button onClick={() => { clicked = true }}>Click</Button>)
    screen.getByText("Click").click()
    expect(clicked).toBe(true)
  })
})
