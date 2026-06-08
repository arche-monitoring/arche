import { Hono } from "hono";
import { db } from "../database/client.ts";
import { settings } from "../database/schema.ts";

const router = new Hono();
const AUTH_KEYS = new Set(["auth_username", "auth_password_hash"]);

router.get("/", async (c) => {
  const rows = await db.select().from(settings);
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (AUTH_KEYS.has(row.key)) continue;
    result[row.key] = row.value;
  }
  return c.json(result);
});

router.put("/", async (c) => {
  const body = await c.req.json() as Record<string, string>;
  for (const [key, value] of Object.entries(body)) {
    if (AUTH_KEYS.has(key)) continue;
    await db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value },
      });
  }
  return c.json({ success: true });
});

export { router as settingsRouter };
