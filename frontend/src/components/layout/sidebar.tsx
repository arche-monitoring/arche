import { NavLink } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import {
  Gauge,
  Monitor,
  Settings,
  Globe,
  LogOut,
} from "lucide-react"

const navItems = [
  { to: "/", icon: Gauge, label: "Dashboard" },
  { to: "/monitors", icon: Monitor, label: "Monitors" },
  { to: "/status-pages", icon: Globe, label: "Status Pages" },
  { to: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar() {
  const { logout, user } = useAuth()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <img src="/logo.png" alt="Arche" className="h-7 w-7" />
        <span className="font-semibold tracking-tight">Arche</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-2">
        <div className="px-3 py-2 text-xs text-muted-foreground truncate">
          {user}
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
