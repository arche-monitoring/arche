import { Activity } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <Activity className="h-5 w-5 text-primary" />
        <span className="font-semibold">Arche</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        All systems
      </div>
    </header>
  )
}
