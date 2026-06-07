import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string | null
}

export function MonitorStatusBadge({ status }: StatusBadgeProps) {
  if (!status || status === "unknown") {
    return <Badge variant="outline">Unknown</Badge>
  }

  return (
    <Badge
      variant={status === "up" ? "success" : "destructive"}
      className={cn(
        "gap-1.5",
        status === "up" && "bg-emerald-500/20 text-emerald-400",
        status === "down" && "bg-red-500/20 text-red-400",
        status === "error" && "bg-yellow-500/20 text-yellow-400"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "up" && "bg-emerald-400",
          status === "down" && "bg-red-400",
          status === "error" && "bg-yellow-400"
        )}
      />
      {status === "up" ? "Up" : status === "down" ? "Down" : "Error"}
    </Badge>
  )
}
