import { describe, it, expect, beforeEach, vi } from "vitest"
import { api } from "../api-client"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
})

function mockResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("api.auth", () => {
  it("login sends correct request", async () => {
    mockFetch.mockResolvedValue(mockResponse({ token: "abc123", username: "admin" }))
    const result = await api.auth.login("admin", "password123")
    expect(result.token).toBe("abc123")
    expect(result.username).toBe("admin")
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ username: "admin", password: "password123" }),
    }))
  })

  it("logout sends POST", async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true }))
    await api.auth.logout()
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({
      method: "POST",
    }))
  })

  it("me returns auth status", async () => {
    mockFetch.mockResolvedValue(mockResponse({ authenticated: true, username: "admin" }))
    const result = await api.auth.me()
    expect(result.authenticated).toBe(true)
    expect(result.username).toBe("admin")
  })
})

describe("api.monitors", () => {
  it("list returns monitors array", async () => {
    const monitors = [{ id: 1, name: "Test" }]
    mockFetch.mockResolvedValue(mockResponse(monitors))
    const result = await api.monitors.list()
    expect(result).toEqual(monitors)
  })

  it("get returns single monitor", async () => {
    const monitor = { id: 1, name: "Test" }
    mockFetch.mockResolvedValue(mockResponse(monitor))
    const result = await api.monitors.get(1)
    expect(result).toEqual(monitor)
  })

  it("create sends POST with body", async () => {
    const data = { name: "New Monitor", type: "http" as const, target: "https://example.com" }
    mockFetch.mockResolvedValue(mockResponse({ id: 1 }))
    const result = await api.monitors.create(data as any)
    expect(result).toEqual({ id: 1 })
  })

  it("delete sends DELETE", async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true }))
    await api.monitors.delete(1)
    expect(mockFetch).toHaveBeenCalledWith("/api/monitors/1", expect.objectContaining({
      method: "DELETE",
    }))
  })
})

describe("api.checks", () => {
  it("latest returns checks", async () => {
    const checks = [{ id: 1, status: "up" }]
    mockFetch.mockResolvedValue(mockResponse(checks))
    const result = await api.checks.latest()
    expect(result).toEqual(checks)
  })

  it("forMonitor passes limit", async () => {
    mockFetch.mockResolvedValue(mockResponse([]))
    await api.checks.forMonitor(1, 10)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/checks/monitor/1?limit=10",
      expect.any(Object),
    )
  })

  it("uptime returns stats", async () => {
    const stats = { total: 100, up: 99, uptime: 99, avg_response: 150 }
    mockFetch.mockResolvedValue(mockResponse(stats))
    const result = await api.checks.uptime(1, "7d")
    expect(result).toEqual(stats)
  })
})

describe("api.settings", () => {
  it("get returns settings object", async () => {
    const settings = { retention_days: "90" }
    mockFetch.mockResolvedValue(mockResponse(settings))
    const result = await api.settings.get()
    expect(result).toEqual(settings)
  })

  it("update sends PUT", async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true }))
    await api.settings.update({ retention_days: "30" })
    expect(mockFetch).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ retention_days: "30" }),
    }))
  })
})

describe("api.statusPages", () => {
  it("list returns pages", async () => {
    mockFetch.mockResolvedValue(mockResponse([]))
    const result = await api.statusPages.list()
    expect(result).toEqual([])
  })

  it("getPublic returns page with monitors", async () => {
    const page = { id: 1, title: "Status", monitors: [] }
    mockFetch.mockResolvedValue(mockResponse(page))
    const result = await api.statusPages.getPublic("my-slug")
    expect(result).toEqual(page)
  })
})

describe("api-client error handling", () => {
  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue(new Response("Not Found", { status: 404 }))
    await expect(api.monitors.get(999)).rejects.toThrow()
  })

  it("attaches auth token when available", async () => {
    localStorage.setItem("auth_token", "test-token-123")
    mockFetch.mockResolvedValue(mockResponse([]))
    await api.monitors.list()
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/monitors",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token-123",
        }),
      }),
    )
  })
})
