import { useState } from "react"
import { useMonitors, useCreateMonitor, useUpdateMonitor, useDeleteMonitor } from "@/hooks/use-monitors"
import { MonitorList } from "@/components/monitors/monitor-list"
import { MonitorForm } from "@/components/monitors/monitor-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import type { Monitor, MonitorFormData } from "@/types/monitor"
import { Plus } from "lucide-react"

export default function Monitors() {
  const { data: monitors, isLoading } = useMonitors()
  const createMonitor = useCreateMonitor()
  const updateMonitor = useUpdateMonitor()
  const deleteMonitor = useDeleteMonitor()

  const [formOpen, setFormOpen] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleSubmit = (data: MonitorFormData) => {
    if (editingMonitor) {
      updateMonitor.mutate({ id: editingMonitor.id, data })
    } else {
      createMonitor.mutate(data)
    }
    setFormOpen(false)
    setEditingMonitor(null)
  }

  const handleEdit = (monitor: Monitor) => {
    setEditingMonitor(monitor)
    setFormOpen(true)
  }

  const handleDelete = (id: number) => {
    setDeletingId(id)
  }

  const confirmDelete = () => {
    if (deletingId !== null) {
      deleteMonitor.mutate(deletingId)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitors</h1>
          <p className="text-sm text-muted-foreground">Manage your monitoring endpoints.</p>
        </div>
        <Button onClick={() => { setEditingMonitor(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Monitor
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border">
          <MonitorList
            monitors={monitors ?? []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      <MonitorForm
        key={editingMonitor?.id ?? 'new'}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editMonitor={editingMonitor}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Monitor</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this monitor? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </div>
  )
}
