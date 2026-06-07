export type MonitorType = "ping" | "http" | "port" | "imap" | "smtp"

export interface Monitor {
  id: number
  name: string
  type: MonitorType
  target: string
  port: number | null
  username: string | null
  password: string | null
  method: string | null
  expected_status: number | null
  interval: number
  timeout: number
  active: number
  created_at: string
  updated_at: string
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
  monitor_id: number
  status: string
  response_time_ms: number | null
  status_code: number | null
  error_msg: string | null
  checked_at: string
}

export interface UptimeData {
  total: number
  up: number
  uptime: number
  avg_response: number | null
}
