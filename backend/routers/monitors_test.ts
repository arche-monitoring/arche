import { assertEquals, assertExists } from "@std/assert";
import { Hono } from "hono";
import { monitorsRouter } from "./monitors.ts";
Deno.test("monitors router setup", () => {});

Deno.test("GET / returns empty list initially", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(Array.isArray(body), true);
  assertEquals(body.length, 0);
});

Deno.test("POST / creates a new monitor", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test HTTP Monitor",
      type: "http",
      target: "https://example.com",
    }),
  });
  assertEquals(res.status, 201);
  const body = await res.json();
  assertExists(body.id);
  assertEquals(body.name, "Test HTTP Monitor");
  assertEquals(body.type, "http");
  assertEquals(body.target, "https://example.com");
});

Deno.test("POST / creates a ping monitor", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Ping Monitor",
      type: "ping",
      target: "8.8.8.8",
      interval: "30",
      timeout: "10",
    }),
  });
  assertEquals(res.status, 201);
  const body = await res.json();
  assertExists(body.id);
  assertEquals(body.interval, 30);
  assertEquals(body.timeout, 10);
});

Deno.test("GET / returns created monitors", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.length >= 2, true);
});

Deno.test("GET /:id returns single monitor", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors/1");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.id, 1);
  assertEquals(body.name, "Test HTTP Monitor");
});

Deno.test("GET /:id returns 404 for non-existent", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors/999");
  assertEquals(res.status, 404);
});

Deno.test("PUT /:id updates a monitor", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors/1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Updated HTTP Monitor",
      type: "http",
      target: "https://updated.example.com",
      active: "1",
    }),
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);

  const getRes = await app.request("/api/monitors/1");
  const updated = await getRes.json();
  assertEquals(updated.name, "Updated HTTP Monitor");
  assertEquals(updated.target, "https://updated.example.com");
});

Deno.test("DELETE /:id removes a monitor", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors/1", {
    method: "DELETE",
  });
  assertEquals(res.status, 200);
  assertEquals((await res.json()).success, true);

  const getRes = await app.request("/api/monitors/1");
  assertEquals(getRes.status, 404);
});

Deno.test("teardown", () => {
  {/* noop */}
});
