import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function mockResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
})

describe("useMonitors", () => {
  it("fetches and returns monitor list", async () => {
    const monitors = [{ id: 1, name: "Test Monitor" }]
    mockFetch.mockResolvedValue(mockResponse(monitors))

    const { useMonitors } = await import("../use-monitors")
    const { result } = renderHook(() => useMonitors(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(monitors)
  })
})

describe("useMonitor", () => {
  it("fetches a single monitor by id", async () => {
    const monitor = { id: 42, name: "Specific Monitor" }
    mockFetch.mockResolvedValue(mockResponse(monitor))

    const { useMonitor } = await import("../use-monitors")
    const { result } = renderHook(() => useMonitor(42), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(monitor)
  })
})

describe("useChecks", () => {
  it("fetches checks for a monitor", async () => {
    const checks: Array<{ id: number; status: string }> = [
      { id: 1, status: "up" },
      { id: 2, status: "down" },
    ]
    mockFetch.mockResolvedValue(mockResponse(checks))

    const { useChecks } = await import("../use-monitors")
    const { result } = renderHook(() => useChecks(1), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(checks)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/checks/monitor/1?limit=100",
      expect.any(Object),
    )
  })
})

describe("useSettings", () => {
  it("fetches settings", async () => {
    const settings = { retention_days: "90" }
    mockFetch.mockResolvedValue(mockResponse(settings))

    const { useSettings } = await import("../use-monitors")
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(settings)
  })
})
