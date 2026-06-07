import { Activity } from "lucide-react"
import { useMonitors } from "@/hooks/use-monitors"

type OverallStatus = "operational" | "degraded" | "down" | "unknown"

function getOverallStatus(monitors: { last_status: string | null }[]): OverallStatus {
  if (monitors.length === 0) return "unknown"
  const counted = monitors.filter((m) => m.last_status !== null)
  if (counted.length === 0) return "unknown"
  const allDown = counted.every((m) => m.last_status === "down" || m.last_status === "error")
  const someDown = counted.some((m) => m.last_status === "down" || m.last_status === "error")
  if (allDown) return "down"
  if (someDown) return "degraded"
  return "operational"
}

const statusConfig: Record<OverallStatus, { bg: string; label: string }> = {
  operational: { bg: "bg-emerald-500", label: "All systems" },
  degraded: { bg: "bg-yellow-500", label: "Degraded" },
  down: { bg: "bg-red-500", label: "All systems down" },
  unknown: { bg: "bg-gray-400", label: "Checking…" },
}

export function Header() {
  const { data: monitors = [] } = useMonitors()
  const status = getOverallStatus(monitors)
  const { bg, label } = statusConfig[status]

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <Activity className="h-5 w-5 text-primary" />
        <span className="font-semibold">Arche</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${bg}`} />
        {label}
      </div>
    </header>
  )
}
