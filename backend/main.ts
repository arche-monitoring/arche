import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/serve-static";
import { logger } from "./utils/logger.ts";
import { loadConfig } from "./config.ts";
import { getDb } from "./database/client.ts";
import { monitorsRouter } from "./routers/monitors.ts";
import { checksRouter } from "./routers/checks.ts";
import { settingsRouter } from "./routers/settings.ts";
import { statusPagesRouter } from "./routers/status-pages.ts";
import { publicRouter } from "./routers/public.ts";
import { authRouter } from "./routers/auth.ts";
import { authMiddleware, setJwtSecret } from "./middleware/auth.ts";
import { settings } from "./database/schema.ts";
import { eq } from "drizzle-orm";
import { startScheduler, stopScheduler } from "./services/scheduler.ts";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use("/api/*", authMiddleware);

app.route("/api/auth", authRouter);
app.route("/api/monitors", monitorsRouter);
app.route("/api/checks", checksRouter);
app.route("/api/settings", settingsRouter);
app.route("/api/status-pages", statusPagesRouter);
app.route("/api/public", publicRouter);

app.get("/api/health", (c) => c.json({ status: "ok" }));

const isDev = Deno.env.get("ARCHE_DEV") === "true";

if (isDev) {
  app.get("/", (c) => c.redirect("http://localhost:5173"));
} else {
  const staticOpts = {
    root: "./frontend/dist",
    getContent: async (path: string) => {
      try {
        return await Deno.readFile(path);
      } catch {
        return null;
      }
    },
  };

  app.use("/assets/*", serveStatic(staticOpts));

  app.get("/*", async (c) => {
    if (c.req.path.startsWith("/api/")) {
      return c.json({ error: "Not found" }, 404);
    }
    try {
      const content = await Deno.readFile("./frontend/dist/index.html");
      return c.html(new TextDecoder().decode(content));
    } catch {
      return c.text(
        "Frontend not built. Run: cd frontend && deno run build",
        503,
      );
    }
  });
}

const config = loadConfig();
const db = await getDb();

const envSecret = Deno.env.get("JWT_SECRET");
if (envSecret) {
  setJwtSecret(envSecret);
} else {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "jwt_secret"));
  if (rows[0]?.value) {
    setJwtSecret(rows[0].value);
  } else {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const secret = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await db.insert(settings).values({ key: "jwt_secret", value: secret });
    setJwtSecret(secret);
  }
}

startScheduler();

logger.info(`Arche server starting on port ${config.port}`);
Deno.serve({ port: config.port }, app.fetch);

globalThis.addEventListener("unload", () => {
  stopScheduler();
});
