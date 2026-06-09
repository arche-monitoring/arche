import { Hono } from "hono";
import { monitorsRouter } from "./monitors.ts";
import { checksRouter } from "./checks.ts";
import { db } from "../database/client.ts";
import { checks } from "../database/schema.ts";
let monitorId = 0;

Deno.test("checks router setup", () => {});

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
  if (Array.isArray(body) !== true) {
    throw new Error(`Expected ${true}, got ${Array.isArray(body)}`);
  }
  if (body.length !== 3) throw new Error(`Expected ${3}, got ${body.length}`);
  if (body[0].status !== "up") {
    throw new Error(`Expected ${"up"}, got ${body[0].status}`);
  }
  if (body[0].monitorId !== monitorId) {
    throw new Error(`Expected ${monitorId}, got ${body[0].monitorId}`);
  }
});

Deno.test("GET /monitor/:id respects limit parameter", async () => {
  const app = new Hono();
  app.route("/api/checks", checksRouter);

  const res = await app.request(
    `/api/checks/monitor/${monitorId}?limit=2`,
  );
  const body = await res.json();
  if (body.length !== 2) throw new Error(`Expected ${2}, got ${body.length}`);
});

Deno.test("GET /latest returns latest check per monitor", async () => {
  const app = new Hono();
  app.route("/api/checks", checksRouter);

  const res = await app.request("/api/checks/latest");
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (Array.isArray(body) !== true) {
    throw new Error(`Expected ${true}, got ${Array.isArray(body)}`);
  }
  if (body.length >= 1 !== true) {
    throw new Error(`Expected ${true}, got ${body.length >= 1}`);
  }
  if (body[0].monitorId !== monitorId) {
    throw new Error(`Expected ${monitorId}, got ${body[0].monitorId}`);
  }
  if (body[0].status !== "up") {
    throw new Error(`Expected ${"up"}, got ${body[0].status}`);
  }
});

Deno.test("GET /uptime/:id returns uptime stats", async () => {
  const app = new Hono();
  app.route("/api/checks", checksRouter);

  const res = await app.request(
    `/api/checks/uptime/${monitorId}?range=24h`,
  );
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.total == null) {
    throw new Error(`Expected value to exist, got ${body.total}`);
  }
  if (body.up == null) {
    throw new Error(`Expected value to exist, got ${body.up}`);
  }
  if (body.uptime == null) {
    throw new Error(`Expected value to exist, got ${body.uptime}`);
  }
  if (body.total !== 3) throw new Error(`Expected ${3}, got ${body.total}`);
  if (body.up !== 2) throw new Error(`Expected ${2}, got ${body.up}`);
});

Deno.test("teardown", () => {
  {/* noop */}
});
