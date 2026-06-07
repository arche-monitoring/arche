import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import type { Monitor, MonitorFormData, MonitorType } from "@/types/monitor"

const monitorTypes: { value: MonitorType; label: string }[] = [
  { value: "ping", label: "Ping" },
  { value: "http", label: "HTTP(S)" },
  { value: "port", label: "Port" },
  { value: "imap", label: "IMAP" },
  { value: "smtp", label: "SMTP" },
]

const defaultForm: MonitorFormData = {
  name: "",
  type: "ping",
  target: "",
  port: "",
  username: "",
  password: "",
  method: "GET",
  expected_status: "200",
  interval: "60",
  timeout: "30",
}

interface MonitorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: MonitorFormData) => void
  editMonitor?: Monitor | null
}

export function MonitorForm({ open, onOpenChange, onSubmit, editMonitor }: MonitorFormProps) {
  const [form, setForm] = useState<MonitorFormData>(() => {
    if (editMonitor) {
      return {
        name: editMonitor.name,
        type: editMonitor.type,
        target: editMonitor.target,
        port: editMonitor.port?.toString() || "",
        username: editMonitor.username || "",
        password: editMonitor.password || "",
        method: editMonitor.method || "GET",
        expected_status: editMonitor.expected_status?.toString() || "200",
        interval: editMonitor.interval.toString(),
        timeout: editMonitor.timeout.toString(),
      }
    }
    return { ...defaultForm }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const update = (key: keyof MonitorFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isHttp = form.type === "http"
  const needsPort = form.type === "port" || form.type === "imap" || form.type === "smtp"
  const needsAuth = form.type === "imap"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{editMonitor ? "Edit Monitor" : "New Monitor"}</DialogTitle>
          <DialogDescription>
            Configure the endpoint you want to monitor.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="My Service"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select
              id="type"
              options={monitorTypes}
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="target">
              {form.type === "http" ? "URL" : form.type === "ping" ? "Hostname / IP" : "Hostname"}
            </Label>
            <Input
              id="target"
              value={form.target}
              onChange={(e) => update("target", e.target.value)}
              placeholder={
                form.type === "http"
                  ? "https://example.com"
                  : form.type === "ping"
                  ? "8.8.8.8"
                  : "mail.example.com"
              }
              required
            />
          </div>

          {needsPort && (
            <div className="grid gap-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={form.port}
                onChange={(e) => update("port", e.target.value)}
                placeholder={form.type === "imap" ? "993" : form.type === "smtp" ? "587" : "80"}
              />
            </div>
          )}

          {needsAuth && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          {isHttp && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="method">HTTP Method</Label>
                <Select
                  id="method"
                  options={[
                    { value: "GET", label: "GET" },
                    { value: "HEAD", label: "HEAD" },
                    { value: "POST", label: "POST" },
                  ]}
                  value={form.method}
                  onChange={(e) => update("method", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expected_status">Expected Status Code</Label>
                <Input
                  id="expected_status"
                  type="number"
                  value={form.expected_status}
                  onChange={(e) => update("expected_status", e.target.value)}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="interval">Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                value={form.interval}
                onChange={(e) => update("interval", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={form.timeout}
                onChange={(e) => update("timeout", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{editMonitor ? "Save" : "Create"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
