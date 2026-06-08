import { useState } from "react"
import { useMonitors, useCreateMonitor } from "@/hooks/use-monitors"
import { MonitorCard } from "@/components/monitors/monitor-card"
import { MonitorForm } from "@/components/monitors/monitor-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { MonitorFormData } from "@/types/monitor"
import { Plus } from "lucide-react"

export default function Dashboard() {
  const { data: monitors, isLoading } = useMonitors()
  const [formOpen, setFormOpen] = useState(false)
  const createMonitor = useCreateMonitor()

  const handleCreate = (data: MonitorFormData) => {
    createMonitor.mutate(data)
    setFormOpen(false)
  }

  const upCount = monitors?.filter((m) => m.last_status === "up").length ?? 0
  const downCount = monitors?.filter((m) => m.last_status === "down" || m.last_status === "error").length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of all your monitors.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Monitor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Monitors</p>
          <p className="text-2xl font-bold">{monitors?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Online</p>
          <p className="text-2xl font-bold text-emerald-400">{upCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Offline</p>
          <p className="text-2xl font-bold text-red-400">{downCount}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monitors?.map((m) => <MonitorCard key={m.id} monitor={m} />)}
          {monitors?.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">
              No monitors yet. Head to the Monitors page to create one.
            </div>
          )}
        </div>
      )}

      <MonitorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  )
}
