/** Tests for Select component. */

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, vi } from "vitest"
import Select from "@/components/ui/Select"

describe("Select", () => {
  const options = [
    { value: "", label: "Select..." },
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2", group: "Group A" },
    { value: "opt3", label: "Option 3", group: "Group A" },
  ]

  it("renders with label", () => {
    render(<Select label="Test Select" options={options} />)
    expect(screen.getByLabelText("Test Select")).toBeTruthy()
  })

  it("renders all options", () => {
    render(<Select label="Test Select" options={options} />)
    expect(screen.getByText("Option 1")).toBeTruthy()
    expect(screen.getByText("Option 2")).toBeTruthy()
    expect(screen.getByText("Option 3")).toBeTruthy()
  })

  it("shows placeholder when selected value is empty", () => {
    render(<Select label="Test Select" options={options} value="" />)
    const select = screen.getByLabelText("Test Select") as HTMLSelectElement
    expect(select.value).toBe("")
  })

  it("calls onChange when value changes", () => {
    const onChange = vi.fn()
    render(<Select label="Test Select" options={options} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Test Select"), { target: { value: "opt1" } })
    expect(onChange).toHaveBeenCalled()
  })

  it("renders with error message", () => {
    render(<Select label="Test Select" options={options} error="This field is required" />)
    expect(screen.getByText("This field is required")).toBeTruthy()
  })

  it("renders as disabled", () => {
    render(<Select label="Test Select" options={options} disabled />)
    const select = screen.getByLabelText("Test Select") as HTMLSelectElement
    expect(select.disabled).toBe(true)
  })

  it("renders optgroup for grouped options", () => {
    render(<Select label="Test Select" options={options} />)
    const optgroup = document.querySelector("optgroup")
    expect(optgroup).toBeTruthy()
    expect(optgroup?.getAttribute("label")).toBe("Group A")
  })
})
