import type { Monitor, MonitorFormData, Check, UptimeData } from "@/types/monitor"

const BASE = "/api"

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  monitors: {
    list: () => request<Monitor[]>("/monitors"),
    get: (id: number) => request<Monitor>(`/monitors/${id}`),
    create: (data: MonitorFormData) =>
      request<{ id: number }>("/monitors", {
        method: "POST",
        body: JSON.stringify(normalizeFormData(data)),
      }),
    update: (id: number, data: MonitorFormData) =>
      request<void>(`/monitors/${id}`, {
        method: "PUT",
        body: JSON.stringify(normalizeFormData(data)),
      }),
    delete: (id: number) =>
      request<void>(`/monitors/${id}`, { method: "DELETE" }),
    refreshFavicon: (id: number) =>
      request<{ favicon: string | null }>(`/monitors/${id}/refresh-favicon`, { method: "POST" }),
    refreshAllFavicons: () =>
      request<void>("/monitors/refresh-favicons", { method: "POST" }),
  },
  checks: {
    latest: () => request<Check[]>("/checks/latest"),
    forMonitor: (id: number, limit = 100) =>
      request<Check[]>(`/checks/monitor/${id}?limit=${limit}`),
    uptime: (id: number, range = "24h") =>
      request<UptimeData>(`/checks/uptime/${id}?range=${range}`),
  },
  settings: {
    get: () => request<Record<string, string>>("/settings"),
    update: (data: Record<string, string>) =>
      request<void>("/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
}

function normalizeFormData(data: MonitorFormData) {
  return {
    name: data.name,
    type: data.type,
    target: data.target,
    port: data.port ? parseInt(data.port, 10) : null,
    username: data.username || null,
    password: data.password || null,
    method: data.method || "GET",
    expected_status: data.expected_status ? parseInt(data.expected_status, 10) : 200,
    interval: parseInt(data.interval, 10) || 60,
    timeout: parseInt(data.timeout, 10) || 30,
  }
}
