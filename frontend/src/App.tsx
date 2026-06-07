import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AuthProvider, useAuth } from "@/lib/auth"
import { AppLayout } from "@/components/layout/app-layout"
import Dashboard from "@/pages/Dashboard"
import Monitors from "@/pages/Monitors"
import MonitorDetail from "@/pages/MonitorDetail"
import Settings from "@/pages/Settings"
import StatusPages from "@/pages/StatusPages"
import PublicStatusPage from "@/pages/PublicStatusPage"
import Login from "@/pages/Login"
import { Loader2 } from "lucide-react"

function ProtectedRoute() {
  const { isAuthenticated, isLoading, isSetupRequired } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isSetupRequired) {
    return <Navigate to="/login" replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/monitors" element={<Monitors />} />
            <Route path="/monitors/:id" element={<MonitorDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/status-pages" element={<StatusPages />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
        <Route path="/status/:slug" element={<PublicStatusPage />} />
      </Routes>
    </AuthProvider>
  )
}
