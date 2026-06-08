import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { MonitorStatusBadge } from "./monitor-status-badge"
import { useChecks } from "@/hooks/use-monitors"
import type { Monitor } from "@/types/monitor"
import { Globe, Terminal, Mail, MessageSquare, Search, Network } from "lucide-react"
import {
  AreaChart, Area, ResponsiveContainer,
} from "recharts"

const typeIcons: Record<string, React.ReactNode> = {
  ping: <Terminal className="h-4 w-4" />,
  http: <Globe className="h-4 w-4" />,
  imap: <Mail className="h-4 w-4" />,
  smtp: <MessageSquare className="h-4 w-4" />,
  dns: <Search className="h-4 w-4" />,
  tcp: <Network className="h-4 w-4" />,
}

interface MonitorCardProps {
  monitor: Monitor
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const navigate = useNavigate()
  const { data: checks } = useChecks(monitor.id)

  const responseTime = monitor.last_response_time
    ? `${monitor.last_response_time}ms`
    : "—"

  const sparkData = (checks ?? [])
    .slice()
    .reverse()
    .map((c) => ({ v: c.responseTimeMs ?? 0 }))

  const hasSparkData = sparkData.length > 1
  const displayData = hasSparkData ? sparkData : [{ v: 0 }, { v: 0 }]
  const lineColor = hasSparkData
    ? (monitor.last_status === "up" ? "hsl(160 84% 39%)" : "hsl(0 84% 60%)")
    : "hsl(var(--muted-foreground))"

  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={() => navigate(`/monitors/${monitor.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted overflow-hidden">
              {monitor.favicon
                ? <img src={monitor.favicon} alt="" className="h-6 w-6" />
                : typeIcons[monitor.type] || <Globe className="h-4 w-4" />
              }
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{monitor.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{monitor.target}</p>
            </div>
          </div>
          <MonitorStatusBadge status={monitor.last_status} />
        </div>
        <div className="mt-2 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id={`spark-fill-${monitor.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={lineColor}
                strokeWidth={1.5}
                fill={`url(#spark-fill-${monitor.id})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{responseTime}</span>
          <span className="uppercase">{monitor.type}</span>
          {monitor.last_checked_at && (
            <span>
              {new Date(monitor.last_checked_at.replace(" ", "T")).toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
