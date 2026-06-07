# Arche — uptime monitoring dashboard

## Stack
- **Backend:** Deno 2, Hono, SQLite (deno.land/x/sqlite), Drizzle ORM, IMAP/SMTP/Ping/HTTP/Port checks
- **Frontend:** React 18, Vite 6, Tailwind CSS 3 + shadcn/ui, TanStack React Query, React Router, Recharts
- **Deploy:** Docker (denoland/deno:alpine-2.1), single binary serving all traffic

## Commands

```sh
# Full-stack dev (both backend + frontend concurrently)
deno run -A scripts/dev.ts

# Backend only (with file watch)
deno task dev

# Frontend only
deno task dev:frontend

# Lint / format
deno task lint         # deno lint
deno task lint:fix
deno task fmt          # deno fmt --check
deno task fmt:fix

# Type checking
deno task check        # backend only (deno check)
deno task check:all    # backend + frontend (npx tsc --noEmit)

# DB migrations (Drizzle Kit via npm)
deno task db:generate
deno task db:push

# Production start
deno task start
```

## Conventions

- **DB auto-migrates on startup** — `drizzle-orm/sqlite-proxy/migrator` runs all pending migrations when the server starts. `db:generate` / `db:push` are only needed during schema development.
- **No tests exist** anywhere in the repo. Do not look for test files or test commands.
- **No CI/CD** configured. No `.github/` directory.
- **Permissions:** The backend always needs `--allow-run --allow-sys` (for `ping` checks via `Deno.Command`). The `deno task` commands include these; always include them when running manually.
- **Env:** Copy `.env.example` to `.env`. Required vars: `PORT` (3001), `DB_PATH` (./data/arche.db), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (alerts work without Telegram — they silently skip if unset).
- **Frontend proxy:** Vite dev server (port 5173) proxies `/api/*` to backend (port 3001). In production, Docker runs only the backend; it serves `frontend/dist/` if needed (not yet implemented — the Dockerfile only copies dist but doesn't serve it).
- **Path aliases:** Frontend uses `@/` → `./src/*` (configured in both `vite.config.ts` and `tsconfig.json`). Backend uses Deno-style bare imports (no path aliases).
- **shadcn/ui:** Components live under `frontend/src/components/`, configured via `frontend/components.json`. Use `npx shadcn@latest add <component>` to add new shadcn components.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/monitors` | List all monitors with latest check status |
| GET | `/api/monitors/:id` | Get single monitor |
| POST | `/api/monitors` | Create monitor |
| PUT | `/api/monitors/:id` | Update monitor |
| DELETE | `/api/monitors/:id` | Delete monitor |
| GET | `/api/checks/latest` | Latest check per monitor |
| GET | `/api/checks/monitor/:id?limit=N` | Checks for a monitor (default 50) |
| GET | `/api/checks/uptime/:id?range=24h\|7d\|30d` | Uptime stats |
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings` | Bulk-upsert settings |
| GET | `/api/health` | Health check |

## Project structure

```
backend/
├── main.ts              # Entrypoint (Hono app, CORS, routes, scheduler)
├── config.ts            # Env-based config
├── database/
│   ├── schema.ts        # Drizzle schema (monitors, checks, settings)
│   ├── client.ts        # SQLite init + auto-migration
│   └── drizzle.config.ts
├── routers/             # Hono route handlers
├── services/            # Scheduler (10s tick), Telegram alerts
├── monitors/            # Check implementations (http, ping, port, imap, smtp)
└── utils/               # Logger (colored console with timestamps)
frontend/
├── src/
│   ├── main.tsx         # React entry (BrowserRouter, QueryClientProvider)
│   ├── App.tsx          # Routes
│   ├── pages/           # Dashboard, Monitors, MonitorDetail, Settings
│   ├── components/      # shadcn/ui + custom components
│   └── lib/             # Utility helpers
└── vite.config.ts       # Proxy /api → localhost:3001
```
