export type MonitorType = "ping" | "http" | "port" | "imap" | "smtp" | "dns" | "tcp"

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
  checkedAt: string
}

export interface UptimeData {
  total: number
  up: number
  uptime: number
  avg_response: number | null
}
