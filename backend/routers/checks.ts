import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../database/client.ts";
import { checks } from "../database/schema.ts";

const router = new Hono();

router.get("/latest", async (c) => {
  const db = getDb();
  const rows = await db.select()
    .from(checks)
    .where(
      sql`(monitor_id, checked_at) IN (
        SELECT monitor_id, MAX(checked_at)
        FROM checks
        GROUP BY monitor_id
      )`,
    )
    .orderBy(desc(checks.monitorId));

  return c.json(rows);
});

router.get("/monitor/:id", async (c) => {
  const monitorId = parseInt(c.req.param("id"), 10);
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const db = getDb();
  const rows = await db.select()
    .from(checks)
    .where(eq(checks.monitorId, monitorId))
    .orderBy(desc(checks.checkedAt))
    .limit(limit);

  return c.json(rows);
});

router.get("/uptime/:id", async (c) => {
  const monitorId = parseInt(c.req.param("id"), 10);
  const range = c.req.query("range") || "24h";
  const sinceHours = range === "7d" ? 168 : range === "30d" ? 720 : 24;

  const db = getDb();
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    upCount: sql<number>`SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END)`,
    avgResponse: sql<number | null>`AVG(response_time_ms)`,
  })
    .from(checks)
    .where(
      and(
        eq(checks.monitorId, monitorId),
        sql`checked_at >= datetime('now', '-' || ${sinceHours} || ' hours')`,
      ),
    );

  const { total, upCount, avgResponse } = result[0];
  return c.json({
    total: Number(total),
    up: Number(upCount),
    uptime: Number(total) > 0
      ? Math.round((Number(upCount) / Number(total)) * 10000) / 100
      : 100,
    avg_response: avgResponse ? Math.round(Number(avgResponse)) : null,
  });
});

export { router as checksRouter };
