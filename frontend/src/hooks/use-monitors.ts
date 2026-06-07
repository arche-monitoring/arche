import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { MonitorFormData, StatusPageFormData } from "@/types/monitor"

export function useMonitors() {
  return useQuery({
    queryKey: ["monitors"],
    queryFn: api.monitors.list,
  })
}

export function useMonitor(id: number) {
  return useQuery({
    queryKey: ["monitors", id],
    queryFn: () => api.monitors.get(id),
  })
}

export function useChecks(monitorId: number) {
  return useQuery({
    queryKey: ["checks", monitorId],
    queryFn: () => api.checks.forMonitor(monitorId),
    refetchInterval: 10_000,
  })
}

export function useUptime(monitorId: number, range = "24h") {
  return useQuery({
    queryKey: ["uptime", monitorId, range],
    queryFn: () => api.checks.uptime(monitorId, range),
  })
}

export function useCreateMonitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MonitorFormData) => api.monitors.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  })
}

export function useUpdateMonitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MonitorFormData }) =>
      api.monitors.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  })
}

export function useDeleteMonitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.monitors.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  })
}

export function useRefreshFavicon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.monitors.refreshFavicon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  })
}

export function useRefreshAllFavicons() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.monitors.refreshAllFavicons(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitors"] }),
  })
}

export function useStatusPages() {
  return useQuery({
    queryKey: ["status-pages"],
    queryFn: api.statusPages.list,
  })
}

export function useCreateStatusPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StatusPageFormData) => api.statusPages.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status-pages"] }),
  })
}

export function useUpdateStatusPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StatusPageFormData }) =>
      api.statusPages.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status-pages"] }),
  })
}

export function useDeleteStatusPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.statusPages.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status-pages"] }),
  })
}

export function usePublicStatusPage(slug: string) {
  return useQuery({
    queryKey: ["public-status-page", slug],
    queryFn: () => api.statusPages.getPublic(slug),
    refetchInterval: 15_000,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, string>) => api.settings.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })
}
