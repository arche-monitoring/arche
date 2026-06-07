import { Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import Dashboard from "@/pages/Dashboard"
import Monitors from "@/pages/Monitors"
import MonitorDetail from "@/pages/MonitorDetail"
import Settings from "@/pages/Settings"
import StatusPages from "@/pages/StatusPages"
import PublicStatusPage from "@/pages/PublicStatusPage"

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/monitors" element={<Monitors />} />
        <Route path="/monitors/:id" element={<MonitorDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/status-pages" element={<StatusPages />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="/status/:slug" element={<PublicStatusPage />} />
    </Routes>
  )
}
