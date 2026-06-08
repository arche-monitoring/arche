# Arche — uptime monitoring dashboard

## Stack

- **Backend:** Deno 2, Hono, SQLite (deno.land/x/sqlite), Drizzle ORM,
  IMAP/SMTP/Ping/HTTP/Port/DNS/TCP checks
- **Frontend:** React 18, Vite 6, Tailwind CSS 3 + shadcn/ui, TanStack React
  Query, React Router, Recharts
- **Deploy:** Docker (denoland/deno:alpine-2.1), single binary serving all
  traffic

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

# Testing
deno task test         # backend tests (Deno test runner)
npm test               # frontend tests (vitest) — run from frontend/

# DB migrations (Drizzle Kit via npm)
deno task db:generate
deno task db:push

# Production start
deno task start
```

## Conventions

- **DB auto-migrates on startup** — `drizzle-orm/sqlite-proxy/migrator` runs all
  pending migrations when the server starts. `db:generate` / `db:push` are only
  needed during schema development.
- **Tests** exist in `backend/` (Deno test runner, `*_test.ts`) and
  `frontend/src/` (vitest + React Testing Library, `*.test.ts`/`.test.tsx`). Run
  with `deno task test` and `npm test` respectively.
- **CI/CD** configured in `.github/workflows/ci.yml` — runs lint, format, type
  checks, tests, and frontend build on push/PR to main.
- **Permissions:** The backend always needs
  `--allow-net --allow-read --allow-write --allow-env --allow-run --allow-sys`.
  The `deno task` commands include these; always include them when running
  manually.
- **Env:** Copy `.env.example` to `.env`. Required vars: `PORT` (3000),
  `DB_PATH` (./data/arche.db). Optional: `TELEGRAM_BOT_TOKEN`,
  `TELEGRAM_CHAT_ID`, `DISCORD_WEBHOOK_URL` (alerts silently skip if unset at
  first run; tokens are read from the DB settings table at runtime).
- **Auth:** Token-based auth with PBKDF2 password hashing and Bearer tokens. The
  first user is created via the `/api/auth/setup` endpoint on initial launch.
  All API routes except `/api/auth/setup`, `/api/auth/login`, `/api/public/*`,
  and `/api/health` require authentication.
- **Frontend proxy:** Vite dev server (port 5173) proxies `/api/*` to backend
  (port 3000). In production, Docker runs only the backend; the Dockerfile
  copies `frontend/dist/` but serving is not yet implemented.
- **Path aliases:** Frontend uses `@/` → `./src/*` (configured in both
  `vite.config.ts` and `tsconfig.json`). Backend uses Deno-style bare imports
  (no path aliases).
- **shadcn/ui:** Components live under `frontend/src/components/ui/`, configured
  via `frontend/components.json`. Use `npx shadcn@latest add <component>` to add
  new shadcn components.
- **Dockerfile** is at `docker/Dockerfile`. Build context is the project root.

## API

| Method | Path                                        | Description                                |
| ------ | ------------------------------------------- | ------------------------------------------ |
| POST   | `/api/auth/login`                           | Login (rate-limited: 5/60s)                |
| POST   | `/api/auth/logout`                          | Logout                                     |
| GET    | `/api/auth/me`                              | Check auth status                          |
| POST   | `/api/auth/setup`                           | Initial setup (rate-limited: 3/60s)        |
| POST   | `/api/auth/change-credentials`              | Change username/password (rate-limited)    |
| GET    | `/api/monitors`                             | List all monitors with latest check status |
| POST   | `/api/monitors`                             | Create monitor                             |
| POST   | `/api/monitors/refresh-favicons`            | Refresh all favicons                       |
| POST   | `/api/monitors/:id/refresh-favicon`         | Refresh favicon for one monitor            |
| GET    | `/api/monitors/:id`                         | Get single monitor                         |
| PUT    | `/api/monitors/:id`                         | Update monitor                             |
| DELETE | `/api/monitors/:id`                         | Delete monitor                             |
| GET    | `/api/checks/latest`                        | Latest check per monitor                   |
| GET    | `/api/checks/monitor/:id?limit=N`           | Checks for a monitor (default 50)          |
| GET    | `/api/checks/uptime/:id?range=24h\|7d\|30d` | Uptime stats                               |
| GET    | `/api/settings`                             | Get all settings (excludes auth keys)      |
| PUT    | `/api/settings`                             | Bulk-upsert settings                       |
| GET    | `/api/status-pages`                         | List all status pages                      |
| GET    | `/api/status-pages/:id`                     | Get single status page                     |
| POST   | `/api/status-pages`                         | Create status page                         |
| PUT    | `/api/status-pages/:id`                     | Update status page                         |
| DELETE | `/api/status-pages/:id`                     | Delete status page                         |
| GET    | `/api/public/status-page/:slug`             | Get public status page (no auth required)  |
| GET    | `/api/health`                               | Health check                               |

## Project structure

```
backend/
├── main.ts              # Entrypoint (Hono app, CORS, auth, routes, scheduler)
├── config.ts            # Env-based config (PORT, DB_PATH)
├── middleware/
│   └── auth.ts          # Token-based auth (PBKDF2, Bearer tokens, rate limiting)
├── database/
│   ├── schema.ts        # Drizzle schema (monitors, checks, settings, status_pages)
│   ├── client.ts        # SQLite init + auto-migration
│   ├── drizzle.config.ts
│   └── drizzle/         # Single migration file (0000_initial.sql)
├── routers/             # Hono route handlers (auth, monitors, checks, settings, status-pages, public)
├── services/            # Scheduler (10s tick), Telegram alerts, Discord alerts, Favicon fetcher
├── monitors/            # Check implementations (http, ping, port, imap, smtp, dns, tcp)
└── utils/               # Logger (colored console with timestamps)
frontend/
├── src/
│   ├── main.tsx         # React entry (BrowserRouter, QueryClientProvider)
│   ├── App.tsx          # Routes
│   ├── pages/           # Dashboard, Monitors, MonitorDetail, Settings, Login, StatusPages, PublicStatusPage
│   ├── components/
│   │   ├── layout/      # AppLayout, Header, Sidebar
│   │   ├── monitors/    # MonitorCard, MonitorForm, MonitorList, MonitorStatusBadge
│   │   ├── status-pages/# StatusPageForm
│   │   └── ui/          # shadcn/ui components (button, card, dialog, etc.)
│   ├── hooks/           # use-monitors
│   ├── lib/             # api-client, auth context, utils
│   ├── types/           # monitor.ts
│   └── styles/          # globals.css
├── public/
│   └── logo.png
└── vite.config.ts       # Proxy /api → localhost:3000
data/                    # SQLite DB at runtime (gitignored)
docker/
└── Dockerfile           # denoland/deno:alpine-2.1, copies backend/ + frontend/dist/
scripts/
└── dev.ts               # Launches backend + frontend concurrently
```
