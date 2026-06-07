import { assertEquals, assertExists } from "@std/assert";
import { Hono } from "hono";
import { monitorsRouter } from "./monitors.ts";
import { checksRouter } from "./checks.ts";
import { getDb } from "../database/client.ts";
import { checks } from "../database/schema.ts";
import { setupTestDb, teardownTestDb } from "../database/test_utils.ts";

let dbPath = "";
let monitorId = 0;

Deno.test("checks router setup", async () => {
  const setup = await setupTestDb();
  dbPath = setup.path;
});

Deno.test("create a monitor and insert checks", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Check Test Monitor",
      type: "http",
      target: "https://example.com",
    }),
  });
  const body = await res.json();
  monitorId = body.id;

  const db = await getDb();
  await db.insert(checks).values({
    monitorId,
    status: "up",
    responseTimeMs: 100,
    statusCode: 200,
    checkedAt: new Date().toISOString(),
  });
  await db.insert(checks).values({
    monitorId,
    status: "down",
    responseTimeMs: 200,
    statusCode: 500,
    errorMsg: "Server error",
    checkedAt: new Date(Date.now() - 60000).toISOString(),
  });
  await db.insert(checks).values({
    monitorId,
    status: "up",
    responseTimeMs: 50,
    statusCode: 200,
    checkedAt: new Date(Date.now() - 120000).toISOString(),
  });
});

Deno.test("GET /monitor/:id returns checks for a monitor", async () => {
  const app = new Hono();
  app.route("/api/checks", checksRouter);

  const res = await app.request(`/api/checks/monitor/${monitorId}`);
  const body = await res.json();
  assertEquals(Array.isArray(body), true);
  assertEquals(body.length, 3);
  assertEquals(body[0].status, "up");
  assertEquals(body[0].monitorId, monitorId);
});

Deno.test("GET /monitor/:id respects limit parameter", async () => {
  const app = new Hono();
  app.route("/api/checks", checksRouter);

  const res = await app.request(
    `/api/checks/monitor/${monitorId}?limit=2`,
  );
  const body = await res.json();
  assertEquals(body.length, 2);
});

Deno.test("GET /latest returns latest check per monitor", async () => {
  const app = new Hono();
  app.route("/api/checks", checksRouter);

  const res = await app.request("/api/checks/latest");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(Array.isArray(body), true);
  assertEquals(body.length >= 1, true);
  assertEquals(body[0].monitorId, monitorId);
  assertEquals(body[0].status, "up");
});

Deno.test("GET /uptime/:id returns uptime stats", async () => {
  const app = new Hono();
  app.route("/api/checks", checksRouter);

  const res = await app.request(
    `/api/checks/uptime/${monitorId}?range=24h`,
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertExists(body.total);
  assertExists(body.up);
  assertExists(body.uptime);
  assertEquals(body.total, 3);
  assertEquals(body.up, 2);
});

Deno.test("teardown", () => {
  teardownTestDb(dbPath);
});
