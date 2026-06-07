import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { MonitorStatusBadge } from "./monitor-status-badge"
import type { Monitor } from "@/types/monitor"
import { Globe, Terminal, Server, Mail, MessageSquare } from "lucide-react"

const typeIcons: Record<string, React.ReactNode> = {
  ping: <Terminal className="h-4 w-4" />,
  http: <Globe className="h-4 w-4" />,
  port: <Server className="h-4 w-4" />,
  imap: <Mail className="h-4 w-4" />,
  smtp: <MessageSquare className="h-4 w-4" />,
}

interface MonitorCardProps {
  monitor: Monitor
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const navigate = useNavigate()

  const responseTime = monitor.last_response_time
    ? `${monitor.last_response_time}ms`
    : "—"

  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={() => navigate(`/monitors/${monitor.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              {typeIcons[monitor.type] || <Globe className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{monitor.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{monitor.target}</p>
            </div>
          </div>
          <MonitorStatusBadge status={monitor.last_status} />
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{responseTime}</span>
          <span className="capitalize">{monitor.type}</span>
          {monitor.last_checked_at && (
            <span>
              {new Date(monitor.last_checked_at).toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
