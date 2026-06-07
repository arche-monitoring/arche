# Contributing

## Getting started

1. Clone the repo.
2. Copy `.env.example` to `.env` and adjust if needed.
3. Run `deno run -A scripts/dev.ts` — this starts both the backend and frontend
   concurrently. The backend runs on `localhost:3000`, the frontend on
   `localhost:5173` (proxying `/api/*` to the backend).

## Development workflow

- Make your changes.
- Run lint, format, and type checks before committing:

  ```sh
  deno task lint && deno task fmt && deno task check:all
  ```

- If you modify the database schema, generate a migration:

  ```sh
  deno task db:generate
  ```

- New shadcn/ui components can be added via:

  ```sh
  npx shadcn@latest add <component>
  ```

  Keep components in `frontend/src/components/ui/`.

## Project conventions

Refer to [AGENTS.md](AGENTS.md) for the full command reference, API table, and
conventions including auth, permissions, env vars, and project structure.

Key points:

- **Tests** live in `backend/` (Deno test runner, `*_test.ts`) and
  `frontend/src/` (vitest + React Testing Library). Run them with
  `deno task test` and `npm test`.
- **CI/CD** is configured in `.github/workflows/ci.yml`.
- Backend uses Deno-style bare imports; frontend uses `@/` path aliases.
- All API routes except `/api/auth/setup`, `/api/auth/login`, `/api/public/*`,
  and `/api/health` require authentication.
- Telegram/Discord alert tokens are stored in the DB settings table, not env
  vars (the env vars are only used for the initial seed on first run).

## Pull requests

- Keep PRs focused on a single concern.
- Reference any related issues in the description.
- Ensure lint, format, and type checks pass.
- All commits should have descriptive messages consistent with the existing
  style (short first line, body if needed).

## Issues

- Bug reports should include the monitor type, target, and any relevant log
  output.
- Feature requests should describe the use case concisely.
