import { Hono } from "hono";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../database/client.ts";
import { checks, monitors } from "../database/schema.ts";

const router = new Hono();

router.get("/", async (c) => {
  const db = getDb();
  const allMonitors = await db.select().from(monitors).orderBy(
    desc(monitors.createdAt),
  );

  if (allMonitors.length === 0) return c.json([]);

  const ids = allMonitors.map((m: { id: number }) => m.id);
  const allChecks = await db.select()
    .from(checks)
    .where(inArray(checks.monitorId, ids))
    .orderBy(desc(checks.checkedAt));

  const latestByMonitor = new Map<number, typeof allChecks[0]>();
  for (const check of allChecks) {
    if (!latestByMonitor.has(check.monitorId)) {
      latestByMonitor.set(check.monitorId, check);
    }
  }

  const result = allMonitors.map((m: Record<string, unknown>) => {
    const latest = latestByMonitor.get(m.id as number);
    return {
      ...m,
      last_status: latest?.status ?? null,
      last_response_time: latest?.responseTimeMs ?? null,
      last_checked_at: latest?.checkedAt ?? null,
    };
  });

  return c.json(result);
});

router.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb();
  const rows = await db.select().from(monitors).where(eq(monitors.id, id));
  if (rows.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const result = await db.insert(monitors).values({
    name: body.name,
    type: body.type,
    target: body.target,
    port: body.port || null,
    username: body.username || null,
    password: body.password || null,
    method: body.method || "GET",
    expectedStatus: body.expected_status || 200,
    interval: body.interval || 60,
    timeout: body.timeout || 30,
  }).returning();
  return c.json(result[0], 201);
});

router.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json();
  const db = getDb();
  await db.update(monitors)
    .set({
      name: body.name,
      type: body.type,
      target: body.target,
      port: body.port || null,
      username: body.username || null,
      password: body.password || null,
      method: body.method || "GET",
      expectedStatus: body.expected_status || 200,
      interval: body.interval || 60,
      timeout: body.timeout || 30,
      active: body.active ?? 1,
    })
    .where(eq(monitors.id, id));
  return c.json({ success: true });
});

router.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = getDb();
  await db.delete(monitors).where(eq(monitors.id, id));
  return c.json({ success: true });
});

export { router as monitorsRouter };
