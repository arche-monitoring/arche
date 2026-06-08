import { Hono } from "hono";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../database/client.ts";
import { checks, monitors, statusPages } from "../database/schema.ts";

const router = new Hono();

router.get("/status-page/:slug", async (c) => {
  const slug = c.req.param("slug");

  const pages = await db.select().from(statusPages).where(
    eq(statusPages.slug, slug),
  );
  if (pages.length === 0) return c.json({ error: "Not found" }, 404);

  const page = pages[0];

  let monitorIds: number[] = [];
  if (page.showAll) {
    const allMonitors = await db.select({ id: monitors.id }).from(monitors);
    monitorIds = allMonitors.map((m) => m.id);
  } else {
    try {
      monitorIds = JSON.parse(page.monitorIds ?? "[]");
    } catch {
      monitorIds = [];
    }
  }

  if (monitorIds.length === 0) {
    return c.json({ ...page, monitors: [] });
  }

  const pageMonitors = await db.select()
    .from(monitors)
    .where(inArray(monitors.id, monitorIds));

  const allChecks = await db.select()
    .from(checks)
    .where(inArray(checks.monitorId, monitorIds))
    .orderBy(desc(checks.checkedAt));

  const latestByMonitor = new Map<number, typeof allChecks[0]>();
  for (const check of allChecks) {
    if (!latestByMonitor.has(check.monitorId)) {
      latestByMonitor.set(check.monitorId, check);
    }
  }

  const monitorsWithStatus = pageMonitors.map((m) => {
    const latest = latestByMonitor.get(m.id);
    return {
      ...m,
      last_status: latest?.status ?? null,
      last_response_time: latest?.responseTimeMs ?? null,
      last_checked_at: latest?.checkedAt ?? null,
    };
  });

  return c.json({
    ...page,
    monitors: monitorsWithStatus,
  });
});

export { router as publicRouter };
