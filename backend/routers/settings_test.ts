import { Hono } from "hono";
import { settingsRouter } from "./settings.ts";
Deno.test("settings router setup", () => {});

Deno.test("GET / returns settings object", async () => {
  const app = new Hono();
  app.route("/api/settings", settingsRouter);

  const res = await app.request("/api/settings");
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (typeof body !== "object") {
    throw new Error(`Expected ${"object"}, got ${typeof body}`);
  }
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
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  if ((await res.json()).success !== true) {
    throw new Error(`Expected ${true}, got ${(await res.json()).success}`);
  }

  const getRes = await app.request("/api/settings");
  const body = await getRes.json();
  if (body.retention_days !== "90") {
    throw new Error(`Expected ${"90"}, got ${body.retention_days}`);
  }
  if (body.notification_email !== "test@example.com") {
    throw new Error(
      `Expected ${"test@example.com"}, got ${body.notification_email}`,
    );
  }
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
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);

  const getRes = await app.request("/api/settings");
  const body = await getRes.json();
  if (body.retention_days !== "30") {
    throw new Error(`Expected ${"30"}, got ${body.retention_days}`);
  }
  if (body.notification_email !== "test@example.com") {
    throw new Error(
      `Expected ${"test@example.com"}, got ${body.notification_email}`,
    );
  }
});

Deno.test("teardown", () => {
  {/* noop */}
});
