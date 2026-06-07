import { useState, useEffect } from "react"
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useMonitors } from "@/hooks/use-monitors"
import type { StatusPage, StatusPageFormData } from "@/types/monitor"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: StatusPageFormData) => void
  editPage?: StatusPage | null
}

export function StatusPageForm({ open, onOpenChange, onSubmit, editPage }: Props) {
  const { data: allMonitors } = useMonitors()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  useEffect(() => {
    if (editPage) {
      setTitle(editPage.title)
      setSlug(editPage.slug)
      setShowAll(!!editPage.showAll)
      try {
        setSelectedIds(JSON.parse(editPage.monitorIds))
      } catch {
        setSelectedIds([])
      }
    } else {
      setTitle("")
      setSlug("")
      setShowAll(false)
      setSelectedIds([])
    }
  }, [editPage, open])

  const generateSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!editPage) setSlug(generateSlug(v))
  }

  const toggleMonitor = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    onSubmit({
      title,
      slug,
      show_all: showAll,
      monitor_ids: showAll ? [] : selectedIds,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{editPage ? "Edit Status Page" : "New Status Page"}</DialogTitle>
        <DialogDescription>
          Create a public status page to share monitor health.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="My Status Page" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slug">URL Path</Label>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>/status/</span>
            <Input id="slug" value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} placeholder="my-status" className="flex-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="showAll" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          <Label htmlFor="showAll">Include all monitors</Label>
        </div>
        {!showAll && (
          <div className="space-y-2">
            <Label>Select Monitors</Label>
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border p-2">
              {allMonitors?.map((m) => (
                <label key={m.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent cursor-pointer">
                  <input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggleMonitor(m.id)} className="rounded" />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground">{m.target}</span>
                </label>
              ))}
              {allMonitors?.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">No monitors available.</p>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title || !slug}>
            {editPage ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
