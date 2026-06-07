import { useParams } from "react-router-dom";
import { usePublicStatusPage } from "@/hooks/use-monitors";
import { MonitorStatusBadge } from "@/components/monitors/monitor-status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe,
  Terminal,
  Server,
  Mail,
  MessageSquare,
  Search,
  Network,
  ExternalLink,
} from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  ping: <Terminal className="h-4 w-4" />,
  http: <Globe className="h-4 w-4" />,
  port: <Server className="h-4 w-4" />,
  imap: <Mail className="h-4 w-4" />,
  smtp: <MessageSquare className="h-4 w-4" />,
  dns: <Search className="h-4 w-4" />,
  tcp: <Network className="h-4 w-4" />,
};

export default function PublicStatusPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = usePublicStatusPage(slug ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Status Page Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The status page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const upCount = data.monitors.filter((m) => m.last_status === "up").length;
  const downCount = data.monitors.filter(
    (m) => m.last_status === "down" || m.last_status === "error",
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {upCount} operational / {downCount} degraded
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Operational</p>
            <p className="text-2xl font-bold text-emerald-400">{upCount}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Degraded</p>
            <p className="text-2xl font-bold text-yellow-400">
              {data.monitors.filter((m) => m.last_status === "error").length}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Down</p>
            <p className="text-2xl font-bold text-red-400">{downCount}</p>
          </div>
        </div>

        <div className="space-y-2">
          {data.monitors.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted overflow-hidden">
                  {m.favicon ? (
                    <img src={m.favicon} alt="" className="h-6 w-6" />
                  ) : (
                    typeIcons[m.type] || <Globe className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.target}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.last_response_time !== null && (
                  <span className="text-xs text-muted-foreground">
                    {m.last_response_time}ms
                  </span>
                )}
                <MonitorStatusBadge status={m.last_status} />
              </div>
            </div>
          ))}
          {data.monitors.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No monitors configured for this page.
            </p>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <a
            href="https://github.com/arche-monitorign/arche"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Powered by Arche
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
