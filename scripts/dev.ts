// Development launcher
// Run: deno run -A scripts/dev.ts
// Starts backend (Deno) and frontend (Vite) concurrently

import { logger } from "../backend/utils/logger.ts";

const backendCmd = new Deno.Command(Deno.execPath(), {
  args: [
    "run",
    "--allow-net",
    "--allow-read",
    "--allow-write",
    "--allow-env",
    "--allow-run",
    "--allow-sys",
    "--watch",
    "backend/main.ts",
  ],
  env: { ARCHE_DEV: "true" },
  stdout: "inherit",
  stderr: "inherit",
});

const frontendCmd = new Deno.Command("deno", {
  args: ["run", "dev"],
  cwd: "frontend",
  stdout: "inherit",
  stderr: "inherit",
});

logger.info("Starting Arche development environment...");

const backend = backendCmd.spawn();
const frontend = frontendCmd.spawn();

globalThis.addEventListener("unload", () => {
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
});

await Promise.all([backend.status, frontend.status]);
