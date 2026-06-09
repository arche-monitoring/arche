import { Hono } from "hono";
import { monitorsRouter } from "./monitors.ts";
Deno.test("monitors router setup", () => {});

Deno.test("GET / returns empty list initially", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors");
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (Array.isArray(body) !== true) {
    throw new Error(`Expected ${true}, got ${Array.isArray(body)}`);
  }
  if (body.length !== 0) throw new Error(`Expected ${0}, got ${body.length}`);
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
  if (res.status !== 201) throw new Error(`Expected ${201}, got ${res.status}`);
  const body = await res.json();
  if (body.id == null) {
    throw new Error(`Expected value to exist, got ${body.id}`);
  }
  if (body.name !== "Test HTTP Monitor") {
    throw new Error(`Expected ${"Test HTTP Monitor"}, got ${body.name}`);
  }
  if (body.type !== "http") {
    throw new Error(`Expected ${"http"}, got ${body.type}`);
  }
  if (body.target !== "https://example.com") {
    throw new Error(`Expected ${"https://example.com"}, got ${body.target}`);
  }
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
  if (res.status !== 201) throw new Error(`Expected ${201}, got ${res.status}`);
  const body = await res.json();
  if (body.id == null) {
    throw new Error(`Expected value to exist, got ${body.id}`);
  }
  if (body.interval !== 30) {
    throw new Error(`Expected ${30}, got ${body.interval}`);
  }
  if (body.timeout !== 10) {
    throw new Error(`Expected ${10}, got ${body.timeout}`);
  }
});

Deno.test("GET / returns created monitors", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors");
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.length >= 2 !== true) {
    throw new Error(`Expected ${true}, got ${body.length >= 2}`);
  }
});

Deno.test("GET /:id returns single monitor", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors/1");
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.id !== 1) throw new Error(`Expected ${1}, got ${body.id}`);
  if (body.name !== "Test HTTP Monitor") {
    throw new Error(`Expected ${"Test HTTP Monitor"}, got ${body.name}`);
  }
});

Deno.test("GET /:id returns 404 for non-existent", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors/999");
  if (res.status !== 404) throw new Error(`Expected ${404}, got ${res.status}`);
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
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.success !== true) {
    throw new Error(`Expected ${true}, got ${body.success}`);
  }

  const getRes = await app.request("/api/monitors/1");
  const updated = await getRes.json();
  if (updated.name !== "Updated HTTP Monitor") {
    throw new Error(`Expected ${"Updated HTTP Monitor"}, got ${updated.name}`);
  }
  if (updated.target !== "https://updated.example.com") {
    throw new Error(
      `Expected ${"https://updated.example.com"}, got ${updated.target}`,
    );
  }
});

Deno.test("DELETE /:id removes a monitor", async () => {
  const app = new Hono();
  app.route("/api/monitors", monitorsRouter);

  const res = await app.request("/api/monitors/1", {
    method: "DELETE",
  });
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  if ((await res.json()).success !== true) {
    throw new Error(`Expected ${true}, got ${(await res.json()).success}`);
  }

  const getRes = await app.request("/api/monitors/1");
  if (getRes.status !== 404) {
    throw new Error(`Expected ${404}, got ${getRes.status}`);
  }
});

Deno.test("teardown", () => {
  {/* noop */}
});
