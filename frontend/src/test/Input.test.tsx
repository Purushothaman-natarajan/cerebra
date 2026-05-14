import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Input from "../components/ui/Input"

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Name" />)
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
  })

  it("shows error message", () => {
    render(<Input label="Name" error="Required" />)
    expect(screen.getByText("Required")).toBeInTheDocument()
  })

  it("shows helper text", () => {
    render(<Input label="Name" helperText="Enter your name" />)
    expect(screen.getByText("Enter your name")).toBeInTheDocument()
  })

  it("accepts user input", async () => {
    const user = userEvent.setup()
    render(<Input label="Name" />)
    const input = screen.getByLabelText("Name")
    await user.type(input, "John")
    expect(input).toHaveValue("John")
  })
})
