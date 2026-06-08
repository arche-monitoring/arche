import type { Monitor, MonitorFormData, Check, UptimeData, StatusPage, StatusPageFormData, StatusPageWithMonitors } from "@/types/monitor"

const BASE = "/api"

function getToken(): string | null {
  try { return localStorage.getItem("auth_token") } catch { return null }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const text = await res.text()
    let message: string
    try {
      const body = JSON.parse(text)
      message = body.error || body.message || text
    } catch {
      message = text
    }
    throw new Error(message || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; username: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    logout: () =>
      request<void>("/auth/logout", { method: "POST" }),
    me: () =>
      request<{ authenticated: boolean; username?: string; setupRequired?: boolean }>("/auth/me"),
    setup: (username: string, password: string) =>
      request<{ token: string; username: string }>("/auth/setup", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    changeCredentials: (currentPassword: string, newUsername: string, newPassword: string) =>
      request<{ token: string; username: string }>("/auth/change-credentials", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newUsername, newPassword }),
      }),
  },
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
  statusPages: {
    list: () => request<StatusPage[]>("/status-pages"),
    get: (id: number) => request<StatusPage>(`/status-pages/${id}`),
    create: (data: StatusPageFormData) =>
      request<StatusPage>("/status-pages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: StatusPageFormData) =>
      request<void>(`/status-pages/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/status-pages/${id}`, { method: "DELETE" }),
    getPublic: (slug: string) =>
      request<StatusPageWithMonitors>(`/public/status-page/${slug}`),
  },
}

function normalizeFormData(data: MonitorFormData) {
  const target = data.type === "ping"
    ? data.target.replace(/^https?:\/\//i, "")
    : data.target
  return {
    name: data.name,
    type: data.type,
    target,
    port: data.port ? parseInt(data.port, 10) : null,
    username: data.username || null,
    password: data.password || null,
    method: data.method || "GET",
    expected_status: data.expected_status ? parseInt(data.expected_status, 10) : 200,
    dns_record_type: data.dns_record_type || "A",
    interval: parseInt(data.interval, 10) || 60,
    timeout: parseInt(data.timeout, 10) || 30,
  }
}
