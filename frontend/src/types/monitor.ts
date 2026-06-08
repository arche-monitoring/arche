export type MonitorType = "ping" | "http" | "imap" | "smtp" | "dns" | "tcp"

export interface Monitor {
  id: number
  name: string
  type: MonitorType
  target: string
  port: number | null
  username: string | null
  password: string | null
  method: string | null
  expectedStatus: number | null
  interval: number
  timeout: number
  active: number
  favicon: string | null
  faviconUpdatedAt: string | null
  createdAt: string
  updatedAt: string
  last_status: string | null
  last_response_time: number | null
  last_checked_at: string | null
}

export interface MonitorFormData {
  name: string
  type: MonitorType
  target: string
  port: string
  username: string
  password: string
  method: string
  expected_status: string
  interval: string
  timeout: string
}

export interface Check {
  id: number
  monitorId: number
  status: string
  responseTimeMs: number | null
  statusCode: number | null
  errorMsg: string | null
  responseBody: string | null
  checkedAt: string
}

export interface UptimeData {
  total: number
  up: number
  uptime: number
  avg_response: number | null
}

export interface StatusPage {
  id: number
  title: string
  slug: string
  showAll: number
  monitorIds: string
  createdAt: string
  updatedAt: string
}

export interface StatusPageFormData {
  title: string
  slug: string
  show_all: boolean
  monitor_ids: number[]
}

export interface StatusPageWithMonitors extends StatusPage {
  monitors: Monitor[]
}
