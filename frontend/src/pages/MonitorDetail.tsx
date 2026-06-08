import { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useMonitor, useChecks, useUptime } from "@/hooks/use-monitors"
import { MonitorStatusBadge } from "@/components/monitors/monitor-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { ArrowLeft, Globe, Terminal, Server, Mail, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"

const typeIcons: Record<string, React.ReactNode> = {
  ping: <Terminal className="h-4 w-4" />,
  http: <Globe className="h-4 w-4" />,
  port: <Server className="h-4 w-4" />,
  imap: <Mail className="h-4 w-4" />,
  smtp: <MessageSquare className="h-4 w-4" />,
}

export default function MonitorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const monitorId = parseInt(id ?? "0", 10)
  const [expandedCheckId, setExpandedCheckId] = useState<number | null>(null)

  const { data: monitor, isLoading: monLoading } = useMonitor(monitorId)
  const { data: checks } = useChecks(monitorId)
  const { data: uptime24h } = useUptime(monitorId, "24h")
  const { data: uptime7d } = useUptime(monitorId, "7d")
  const { data: uptime30d } = useUptime(monitorId, "30d")

  const responseStats = useMemo(() => {
    const times = (checks ?? [])
      .map((c) => c.responseTimeMs)
      .filter((t): t is number => t !== null)
    if (times.length === 0) return null
    return {
      min: Math.min(...times),
      max: Math.max(...times),
      avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    }
  }, [checks])

  const chartData = (checks ?? [])
    .slice()
    .reverse()
    .map((c) => ({
      time: c.checkedAt ? new Date(c.checkedAt.replace(" ", "T")).toLocaleTimeString() : "",
      response: c.responseTimeMs ?? 0,
      status: c.status,
    }))

  const hasChartData = chartData.length > 0
  const displayChartData = hasChartData ? chartData : [{ time: "", response: 0 }, { time: "", response: 0 }]
  const lastStatus = checks?.[0]?.status
  const chartLineColor = hasChartData
    ? (lastStatus === "up" ? "hsl(160 84% 39%)" : "hsl(0 84% 60%)")
    : "hsl(var(--muted-foreground))"

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/monitors")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {monLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !monitor ? (
        <p className="text-muted-foreground">Monitor not found.</p>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden">
                {monitor.favicon
                  ? <img src={monitor.favicon} alt="" className="h-7 w-7" />
                  : typeIcons[monitor.type]
                }
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{monitor.name}</h1>
                <p className="text-sm text-muted-foreground">{monitor.target}</p>
              </div>
            </div>
            <MonitorStatusBadge status={
              checks && checks.length > 0 ? checks[0].status : null
            } />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">24h Uptime</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{uptime24h?.uptime ?? 100}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">7d Uptime</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{uptime7d?.uptime ?? 100}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">30d Uptime</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{uptime30d?.uptime ?? 100}%</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Latest</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {checks?.[0]?.responseTimeMs ? `${checks[0].responseTimeMs}ms` : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Min</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{responseStats ? `${responseStats.min}ms` : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{responseStats ? `${responseStats.avg}ms` : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Max</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{responseStats ? `${responseStats.max}ms` : "—"}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Response Time (last {checks?.length ?? 0} checks)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" fontSize={11} tickLine={false} className="text-muted-foreground" />
                    <YAxis fontSize={11} tickLine={false} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="response"
                      stroke={chartLineColor}
                      strokeWidth={2}
                      dot={false}
                      name="Response (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Checks</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(checks ?? []).slice(0, 20).map((check) => (
                  <div key={check.id}>
                    <div
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                        expandedCheckId === check.id ? "border-primary/50" : ""
                      }`}
                      onClick={() =>
                        setExpandedCheckId(
                          expandedCheckId === check.id ? null : check.id,
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        {(check.responseBody || check.errorMsg) && (
                          <span className="text-muted-foreground">
                            {expandedCheckId === check.id
                              ? <ChevronUp className="h-4 w-4" />
                              : <ChevronDown className="h-4 w-4" />
                            }
                          </span>
                        )}
                        <span
                          className={`h-2 w-2 rounded-full ${
                            check.status === "up" ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        <span className="capitalize">{check.status}</span>
                        {check.responseTimeMs && (
                          <span className="text-muted-foreground">{check.responseTimeMs}ms</span>
                        )}
                        {check.statusCode && (
                          <span className="text-muted-foreground">HTTP {check.statusCode}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {check.checkedAt ? new Date(check.checkedAt.replace(" ", "T")).toLocaleString() : "—"}
                      </span>
                    </div>
                    {expandedCheckId === check.id && (check.responseBody || check.errorMsg) && (
                      <pre className="mt-1 rounded-lg border bg-muted p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                        {check.errorMsg ? `Error: ${check.errorMsg}\n\n` : ""}{check.responseBody ?? ""}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
