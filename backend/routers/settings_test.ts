import { assertEquals } from "@std/assert";
import { Hono } from "hono";
import { settingsRouter } from "./settings.ts";
import { setupTestDb, teardownTestDb } from "../database/test_utils.ts";

let dbPath = "";

Deno.test("settings router setup", async () => {
  const setup = await setupTestDb();
  dbPath = setup.path;
});

Deno.test("GET / returns settings object", async () => {
  const app = new Hono();
  app.route("/api/settings", settingsRouter);

  const res = await app.request("/api/settings");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(typeof body, "object");
});

Deno.test("PUT / updates settings", async () => {
  const app = new Hono();
  app.route("/api/settings", settingsRouter);

  const res = await app.request("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      retention_days: "90",
      notification_email: "test@example.com",
    }),
  });
  assertEquals(res.status, 200);
  assertEquals((await res.json()).success, true);

  const getRes = await app.request("/api/settings");
  const body = await getRes.json();
  assertEquals(body.retention_days, "90");
  assertEquals(body.notification_email, "test@example.com");
});

Deno.test("PUT / merges with existing settings", async () => {
  const app = new Hono();
  app.route("/api/settings", settingsRouter);

  const res = await app.request("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      retention_days: "30",
    }),
  });
  assertEquals(res.status, 200);

  const getRes = await app.request("/api/settings");
  const body = await getRes.json();
  assertEquals(body.retention_days, "30");
  assertEquals(body.notification_email, "test@example.com");
});

Deno.test("teardown", () => {
  teardownTestDb(dbPath);
});
