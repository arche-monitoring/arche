import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MonitorStatusBadge } from "./monitor-status-badge"
import type { Monitor } from "@/types/monitor"
import { Pencil, Trash2, Globe, Terminal, Server, Mail, MessageSquare } from "lucide-react"

const typeIcons: Record<string, React.ReactNode> = {
  ping: <Terminal className="h-3.5 w-3.5" />,
  http: <Globe className="h-3.5 w-3.5" />,
  port: <Server className="h-3.5 w-3.5" />,
  imap: <Mail className="h-3.5 w-3.5" />,
  smtp: <MessageSquare className="h-3.5 w-3.5" />,
}

interface MonitorListProps {
  monitors: Monitor[]
  onEdit: (monitor: Monitor) => void
  onDelete: (id: number) => void
}

export function MonitorList({ monitors, onEdit, onDelete }: MonitorListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Response</TableHead>
          <TableHead>Interval</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {monitors.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {typeIcons[m.type]}
                <span className="capitalize text-xs">{m.type}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{m.target}</TableCell>
            <TableCell><MonitorStatusBadge status={m.last_status} /></TableCell>
            <TableCell className="text-xs">
              {m.last_response_time ? `${m.last_response_time}ms` : "—"}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{m.interval}s</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(m)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {monitors.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              No monitors yet. Create your first one!
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
