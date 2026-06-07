import { describe, it, expect } from "vitest"
import { cn } from "../utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("handles undefined and null", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b")
  })

  it("merges tailwind classes correctly", () => {
    expect(cn("px-4", "px-2")).toBe("px-2")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("handles empty input", () => {
    expect(cn()).toBe("")
  })

  it("handles object syntax", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo")
  })

  it("handles array syntax", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c")
  })
})
