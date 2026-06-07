import { Hono } from "hono";
import { getDb } from "../database/client.ts";
import { settings } from "../database/schema.ts";

const router = new Hono();

router.get("/", async (c) => {
  const db = await getDb();
  const rows = await db.select().from(settings);
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return c.json(result);
});

router.put("/", async (c) => {
  const body = await c.req.json() as Record<string, string>;
  const db = await getDb();
  for (const [key, value] of Object.entries(body)) {
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
