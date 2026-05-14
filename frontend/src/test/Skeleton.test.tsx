import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import Skeleton, { SkeletonCard, SkeletonRow } from "../components/ui/Skeleton"

describe("Skeleton", () => {
  it("renders with pulse animation", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />)
    expect(container.firstChild).toHaveClass("animate-pulse")
  })
})

describe("SkeletonCard", () => {
  it("renders multiple skeleton elements", () => {
    const { container } = render(<SkeletonCard />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(3)
  })
})

describe("SkeletonRow", () => {
  it("renders row elements", () => {
    const { container } = render(<SkeletonRow />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(2)
  })
})
