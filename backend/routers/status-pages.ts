import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../database/client.ts";
import { statusPages } from "../database/schema.ts";

const router = new Hono();

router.get("/", async (c) => {
  const db = await getDb();
  const rows = await db.select().from(statusPages).orderBy(
    desc(statusPages.createdAt),
  );
  return c.json(rows);
});

router.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = await getDb();
  const rows = await db.select().from(statusPages).where(
    eq(statusPages.id, id),
  );
  if (rows.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const db = await getDb();
  const result = await db.insert(statusPages).values({
    title: body.title,
    slug: body.slug,
    showAll: body.show_all ?? 0,
    monitorIds: JSON.stringify(body.monitor_ids ?? []),
  }).returning();
  return c.json(result[0], 201);
});

router.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json();
  const db = await getDb();
  await db.update(statusPages)
    .set({
      title: body.title,
      slug: body.slug,
      showAll: body.show_all ?? 0,
      monitorIds: JSON.stringify(body.monitor_ids ?? []),
    })
    .where(eq(statusPages.id, id));
  return c.json({ success: true });
});

router.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const db = await getDb();
  await db.delete(statusPages).where(eq(statusPages.id, id));
  return c.json({ success: true });
});

export { router as statusPagesRouter };
