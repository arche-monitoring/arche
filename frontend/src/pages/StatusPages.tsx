import { useState } from "react"
import { useStatusPages, useCreateStatusPage, useUpdateStatusPage, useDeleteStatusPage } from "@/hooks/use-monitors"
import { StatusPageForm } from "@/components/status-pages/status-page-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import type { StatusPage, StatusPageFormData } from "@/types/monitor"
import { Plus, ExternalLink, Pencil, Trash2 } from "lucide-react"

export default function StatusPages() {
  const { data: pages, isLoading } = useStatusPages()
  const createPage = useCreateStatusPage()
  const updatePage = useUpdateStatusPage()
  const deletePage = useDeleteStatusPage()

  const [formOpen, setFormOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<StatusPage | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleSubmit = (data: StatusPageFormData) => {
    if (editingPage) {
      updatePage.mutate({ id: editingPage.id, data })
    } else {
      createPage.mutate(data)
    }
    setFormOpen(false)
    setEditingPage(null)
  }

  const handleEdit = (page: StatusPage) => {
    setEditingPage(page)
    setFormOpen(true)
  }

  const handleDelete = (id: number) => {
    setDeletingId(id)
  }

  const confirmDelete = () => {
    if (deletingId !== null) {
      deletePage.mutate(deletingId)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Status Pages</h1>
          <p className="text-sm text-muted-foreground">Create and manage public status pages.</p>
        </div>
        <Button onClick={() => { setEditingPage(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Status Page
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pages?.map((page) => (
            <Card key={page.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <CardDescription>
                      /status/{page.slug}
                    </CardDescription>
                  </div>
                  <Badge variant={page.showAll ? "default" : "secondary"}>
                    {page.showAll ? "All monitors" : "Selected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(`/status/${page.slug}`, "_blank")}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(page)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(page.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pages?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center">
              <h3 className="text-lg font-semibold">No Status Pages yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create a public status page to share your monitors&apos; health.</p>
              <Button className="mt-4" onClick={() => { setEditingPage(null); setFormOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                New Status Page
              </Button>
            </div>
          )}
        </div>
      )}

      <StatusPageForm
        key={editingPage?.id ?? 'new'}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editPage={editingPage}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Status Page</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this status page? This action cannot be undone.
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
