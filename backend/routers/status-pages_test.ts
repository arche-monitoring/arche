import { Hono } from "hono";
import { statusPagesRouter } from "./status-pages.ts";
import { db } from "../database/client.ts";
import { statusPages } from "../database/schema.ts";

let statusPageId: number;

Deno.test("setup", async () => {
  await db.delete(statusPages);
});

Deno.test("GET / returns empty list initially", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages");
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (Array.isArray(body) !== true) {
    throw new Error(`Expected ${true}, got ${Array.isArray(body)}`);
  }
  if (body.length !== 0) throw new Error(`Expected ${0}, got ${body.length}`);
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
  if (res.status !== 201) throw new Error(`Expected ${201}, got ${res.status}`);
  const body = await res.json();
  if (body.id == null || typeof body.id !== "number") {
    throw new Error(`Expected numeric id, got ${body.id}`);
  }
  statusPageId = body.id;
  if (body.title !== "My Status Page") {
    throw new Error(`Expected ${"My Status Page"}, got ${body.title}`);
  }
  if (body.slug !== "my-status") {
    throw new Error(`Expected ${"my-status"}, got ${body.slug}`);
  }
});

Deno.test("POST / validates required fields", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (res.status !== 500) throw new Error(`Expected ${500}, got ${res.status}`);
});

Deno.test("GET /:id returns single status page", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request(`/api/status-pages/${statusPageId}`);
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.id !== statusPageId) throw new Error(`Expected ${statusPageId}, got ${body.id}`);
  if (body.title !== "My Status Page") {
    throw new Error(`Expected ${"My Status Page"}, got ${body.title}`);
  }
});

Deno.test("GET /:id returns 404 for non-existent", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request("/api/status-pages/999");
  if (res.status !== 404) throw new Error(`Expected ${404}, got ${res.status}`);
});

Deno.test("PUT /:id updates a status page", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request(`/api/status-pages/${statusPageId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Updated Status Page",
      slug: "updated-status",
      show_all: true,
      monitor_ids: [1],
    }),
  });
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  if ((await res.json()).success !== true) {
    throw new Error(`Expected ${true}, got ${(await res.json()).success}`);
  }

  const getRes = await app.request(`/api/status-pages/${statusPageId}`);
  const body = await getRes.json();
  if (body.title !== "Updated Status Page") {
    throw new Error(`Expected ${"Updated Status Page"}, got ${body.title}`);
  }
  if (body.slug !== "updated-status") {
    throw new Error(`Expected ${"updated-status"}, got ${body.slug}`);
  }
});

Deno.test("DELETE /:id removes a status page", async () => {
  const app = new Hono();
  app.route("/api/status-pages", statusPagesRouter);

  const res = await app.request(`/api/status-pages/${statusPageId}`, {
    method: "DELETE",
  });
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  if ((await res.json()).success !== true) {
    throw new Error(`Expected ${true}, got ${(await res.json()).success}`);
  }

  const getRes = await app.request(`/api/status-pages/${statusPageId}`);
  if (getRes.status !== 404) {
    throw new Error(`Expected ${404}, got ${getRes.status}`);
  }
});

Deno.test("teardown", () => {
  {/* noop */}
});
