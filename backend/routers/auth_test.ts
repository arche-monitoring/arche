import { Hono } from "hono";
import { authRouter } from "./auth.ts";
import { setJwtSecret } from "../middleware/auth.ts";

const TEST_SECRET = "test-secret-for-jwt-in-router-tests-abcdef";
setJwtSecret(TEST_SECRET);

const ip = (n: number) => ({ "x-forwarded-for": `127.0.0.${n}` });

Deno.test("auth router setup", () => {});

Deno.test("POST /setup creates first user", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(1) },
    body: JSON.stringify({ username: "admin", password: "password123" }),
  });
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.token == null) {
    throw new Error(`Expected value to exist, got ${body.token}`);
  }
  if (body.username !== "admin") {
    throw new Error(`Expected ${"admin"}, got ${body.username}`);
  }
  if (typeof body.token !== "string") {
    throw new Error(`Expected ${"string"}, got ${typeof body.token}`);
  }
});

Deno.test("POST /setup fails if already configured", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(2) },
    body: JSON.stringify({ username: "admin2", password: "password456" }),
  });
  if (res.status !== 400) throw new Error(`Expected ${400}, got ${res.status}`);
  const body = await res.json();
  if (body.error !== "Authentication already configured") {
    throw new Error(
      `Expected ${"Authentication already configured"}, got ${body.error}`,
    );
  }
});

Deno.test("POST /setup requires username and password", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(3) },
    body: JSON.stringify({}),
  });
  if (res.status !== 400) throw new Error(`Expected ${400}, got ${res.status}`);
});

Deno.test("POST /login returns token for valid credentials", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(10) },
    body: JSON.stringify({ username: "admin", password: "password123" }),
  });
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.token == null) {
    throw new Error(`Expected value to exist, got ${body.token}`);
  }
  if (body.username !== "admin") {
    throw new Error(`Expected ${"admin"}, got ${body.username}`);
  }
});

Deno.test("POST /login rejects wrong password", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(11) },
    body: JSON.stringify({ username: "admin", password: "wrong" }),
  });
  if (res.status !== 401) throw new Error(`Expected ${401}, got ${res.status}`);
  const body = await res.json();
  if (body.error !== "Invalid username or password") {
    throw new Error(
      `Expected ${"Invalid username or password"}, got ${body.error}`,
    );
  }
});

Deno.test("POST /login rejects unknown user", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(12) },
    body: JSON.stringify({ username: "nobody", password: "password123" }),
  });
  if (res.status !== 401) throw new Error(`Expected ${401}, got ${res.status}`);
});

Deno.test("POST /login requires username and password", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(13) },
    body: JSON.stringify({}),
  });
  if (res.status !== 400) throw new Error(`Expected ${400}, got ${res.status}`);
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
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.authenticated !== true) {
    throw new Error(`Expected ${true}, got ${body.authenticated}`);
  }
  if (body.username !== "admin") {
    throw new Error(`Expected ${"admin"}, got ${body.username}`);
  }
});

Deno.test("GET /me returns authenticated=false without token", async () => {
  const app = new Hono();
  app.route("/api/auth", authRouter);

  const res = await app.request("/api/auth/me");
  if (res.status !== 200) throw new Error(`Expected ${200}, got ${res.status}`);
  const body = await res.json();
  if (body.authenticated !== false) {
    throw new Error(`Expected ${false}, got ${body.authenticated}`);
  }
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
  if (logoutRes.status !== 200) {
    throw new Error(`Expected ${200}, got ${logoutRes.status}`);
  }

  const body = await logoutRes.json();
  if (body.success !== true) {
    throw new Error(`Expected ${true}, got ${body.success}`);
  }
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
  if (changeRes.status !== 200) {
    throw new Error(`Expected ${200}, got ${changeRes.status}`);
  }
  const changeBody = await changeRes.json();
  if (changeBody.token == null) {
    throw new Error(`Expected value to exist, got ${changeBody.token}`);
  }
  if (changeBody.username !== "newadmin") {
    throw new Error(`Expected ${"newadmin"}, got ${changeBody.username}`);
  }

  const loginWithNew = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ip(20) },
    body: JSON.stringify({ username: "newadmin", password: "newpassword456" }),
  });
  if (loginWithNew.status !== 200) {
    throw new Error(`Expected ${200}, got ${loginWithNew.status}`);
  }
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
  if (res.status !== 401) throw new Error(`Expected ${401}, got ${res.status}`);
});

Deno.test("teardown", () => {
  {/* noop */}
});
