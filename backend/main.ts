import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "./utils/logger.ts";
import { loadConfig } from "./config.ts";
import { getDb } from "./database/client.ts";
import { monitorsRouter } from "./routers/monitors.ts";
import { checksRouter } from "./routers/checks.ts";
import { settingsRouter } from "./routers/settings.ts";
import { statusPagesRouter } from "./routers/status-pages.ts";
import { publicRouter } from "./routers/public.ts";
import { authRouter } from "./routers/auth.ts";
import { authMiddleware } from "./middleware/auth.ts";
import { startScheduler, stopScheduler } from "./services/scheduler.ts";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3001"],
    credentials: true,
  }),
);

app.use("/*", authMiddleware);

app.route("/api/auth", authRouter);
app.route("/api/monitors", monitorsRouter);
app.route("/api/checks", checksRouter);
app.route("/api/settings", settingsRouter);
app.route("/api/status-pages", statusPagesRouter);
app.route("/api/public", publicRouter);

app.get("/api/health", (c) => c.json({ status: "ok" }));

const config = loadConfig();
await getDb();

startScheduler();

logger.info(`Arche server starting on port ${config.port}`);
Deno.serve({ port: config.port }, app.fetch);

globalThis.addEventListener("unload", () => {
  stopScheduler();
});
