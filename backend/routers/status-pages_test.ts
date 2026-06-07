import { assertEquals, assertExists } from "@std/assert";
import { Hono } from "hono";
import { statusPagesRouter } from "./status-pages.ts";
import { setupTestDb, teardownTestDb } from "../database/test_utils.ts";

let dbPath = "";

Deno.test("status pages router setup", async () => {
  const setup = await setupTestDb();
  dbPath = setup.path;
});

Deno.test("GET / returns empty list initially", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(Array.isArray(body), true);
  assertEquals(body.length, 0);
});

Deno.test("POST / creates a status page", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "My Status Page",
      slug: "my-status",
      show_all: false,
      monitor_ids: [1, 2],
    }),
  });
  assertEquals(res.status, 201);
  const body = await res.json();
  assertExists(body.id);
  assertEquals(body.title, "My Status Page");
  assertEquals(body.slug, "my-status");
});

Deno.test("POST / validates required fields", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assertEquals(res.status, 500);
});

Deno.test("GET /:id returns single status page", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages/1");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.id, 1);
  assertEquals(body.title, "My Status Page");
});

Deno.test("GET /:id returns 404 for non-existent", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages/999");
  assertEquals(res.status, 404);
});

Deno.test("PUT /:id updates a status page", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages/1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Updated Status Page",
      slug: "updated-status",
      show_all: true,
      monitor_ids: [1],
    }),
  });
  assertEquals(res.status, 200);
  assertEquals((await res.json()).success, true);

  const getRes = await app.request("/api/status-pages/1");
  const body = await getRes.json();
  assertEquals(body.title, "Updated Status Page");
  assertEquals(body.slug, "updated-status");
});

Deno.test("DELETE /:id removes a status page", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages/1", {
    method: "DELETE",
  });
  assertEquals(res.status, 200);
  assertEquals((await res.json()).success, true);

  const getRes = await app.request("/api/status-pages/1");
  assertEquals(getRes.status, 404);
});

Deno.test("teardown", () => {
  teardownTestDb(dbPath);
});
