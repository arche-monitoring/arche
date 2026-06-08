import { assertEquals, assertExists } from "@std/assert";
import { Hono } from "hono";
import { authRouter } from "./auth.ts";
import { setJwtSecret } from "../middleware/auth.ts";
import { setupTestDb, teardownTestDb } from "../database/test_utils.ts";

const TEST_SECRET = "test-secret-for-jwt-in-router-tests-abcdef";
setJwtSecret(TEST_SECRET);

let dbPath = "";

const ip = (n: number) => ({ "x-forwarded-for": `127.0.0.${n}` });

Deno.test("auth router setup", async () => {
  const setup = await setupTestDb();
  dbPath = setup.path;
});

Deno.test("POST /setup creates first user", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(1) },
    body: JSON.stringify({ username: "admin", password: "password123" }),
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertExists(body.token);
  assertEquals(body.username, "admin");
  assertEquals(typeof body.token, "string");
});

Deno.test("POST /setup fails if already configured", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(2) },
    body: JSON.stringify({ username: "admin2", password: "password456" }),
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.error, "Authentication already configured");
});

Deno.test("POST /setup requires username and password", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(3) },
    body: JSON.stringify({}),
  });
  assertEquals(res.status, 400);
});

Deno.test("POST /login returns token for valid credentials", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(10) },
    body: JSON.stringify({ username: "admin", password: "password123" }),
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertExists(body.token);
  assertEquals(body.username, "admin");
});

Deno.test("POST /login rejects wrong password", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(11) },
    body: JSON.stringify({ username: "admin", password: "wrong" }),
  });
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Invalid username or password");
});

Deno.test("POST /login rejects unknown user", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(12) },
    body: JSON.stringify({ username: "nobody", password: "password123" }),
  });
  assertEquals(res.status, 401);
});

Deno.test("POST /login requires username and password", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(13) },
    body: JSON.stringify({}),
  });
  assertEquals(res.status, 400);
});

Deno.test("GET /me returns authenticated=true with valid token", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const loginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(14) },
    body: JSON.stringify({ username: "admin", password: "password123" }),
  });
  const { token } = await loginRes.json();

  const res = await app.request("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}`, ...ip(15) },
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.authenticated, true);
  assertEquals(body.username, "admin");
});

Deno.test("GET /me returns authenticated=false without token", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/me");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.authenticated, false);
});

Deno.test("POST /logout returns success", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const loginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(16) },
    body: JSON.stringify({ username: "admin", password: "password123" }),
  });
  const { token } = await loginRes.json();

  const logoutRes = await app.request("/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, ...ip(17) },
  });
  assertEquals(logoutRes.status, 200);

  const body = await logoutRes.json();
  assertEquals(body.success, true);
});

Deno.test("POST /change-credentials updates username and password", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const loginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(18) },
    body: JSON.stringify({ username: "admin", password: "password123" }),
  });
  const { token } = await loginRes.json();

  const changeRes = await app.request("/api/auth/change-credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...ip(19),
    },
    body: JSON.stringify({
      currentPassword: "password123",
      newUsername: "newadmin",
      newPassword: "newpassword456",
    }),
  });
  assertEquals(changeRes.status, 200);
  const changeBody = await changeRes.json();
  assertExists(changeBody.token);
  assertEquals(changeBody.username, "newadmin");

  const loginWithNew = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(20) },
    body: JSON.stringify({ username: "newadmin", password: "newpassword456" }),
  });
  assertEquals(loginWithNew.status, 200);
});

Deno.test("POST /change-credentials rejects wrong current password", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const loginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(21) },
    body: JSON.stringify({ username: "newadmin", password: "newpassword456" }),
  });
  const { token } = await loginRes.json();

  const res = await app.request("/api/auth/change-credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...ip(22),
    },
    body: JSON.stringify({
      currentPassword: "wrong",
      newUsername: "admin",
      newPassword: "pass",
    }),
  });
  assertEquals(res.status, 401);
});

Deno.test("teardown", () => {
  teardownTestDb(dbPath);
});
