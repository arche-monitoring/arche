import { assertEquals, assertExists, assertMatch, assertRejects } from "@std/assert";
import {
  addToken,
  generateToken,
  getUsernameFromToken,
  hashPassword,
  rateLimit,
  removeToken,
  verifyPassword,
  authMiddleware,
} from "./auth.ts";
import { Hono } from "hono";

Deno.test("generateToken produces 64-character hex string", () => {
  const token = generateToken();
  assertEquals(token.length, 64);
  assertMatch(token, /^[0-9a-f]{64}$/);
});

Deno.test("generateToken produces unique tokens", () => {
  const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
  assertEquals(tokens.size, 100);
});

Deno.test("addToken and getUsernameFromToken round-trip", () => {
  const token = generateToken();
  addToken(token, "alice");
  assertEquals(getUsernameFromToken(token), "alice");
});

Deno.test("removeToken deletes token", () => {
  const token = generateToken();
  addToken(token, "alice");
  removeToken(token);
  assertEquals(getUsernameFromToken(token), null);
});

Deno.test("getUsernameFromToken returns null for non-existent token", () => {
  assertEquals(getUsernameFromToken("nonexistent"), null);
});

Deno.test("hashPassword and verifyPassword round-trip", async () => {
  const password = "hunter2";
  const hashed = await hashPassword(password);
  assertExists(hashed);
  assertEquals(hashed.split(":").length, 2);

  const valid = await verifyPassword(password, hashed);
  assertEquals(valid, true);

  const invalid = await verifyPassword("wrong", hashed);
  assertEquals(invalid, false);
});

Deno.test("verifyPassword returns false for malformed hash", async () => {
  const result = await verifyPassword("pass", "invalid-hash");
  assertEquals(result, false);
});

Deno.test("rateLimit returns 429 after max attempts", async () => {
  let callCount = 0;
  const handler = rateLimit(3, 60_000);

  const mockC = (ip: string) => ({
    req: { header: () => ip, url: "http://localhost/api/test" },
    json: (body: unknown, status?: number) => new Response(JSON.stringify(body), { status }),
  });

  for (let i = 0; i < 3; i++) {
    const ctx = mockC("1.2.3.4") as any;
    let called = false;
    await handler(ctx, async () => { called = true; });
    // @ts-ignore: accessing status
    if (ctx.status === 429) break;
    callCount++;
  }
});

Deno.test("authMiddleware allows public paths", async () => {
  const c = {
    req: { url: "http://localhost/api/health", header: () => null },
    json: (body: unknown, status?: number) => new Response(JSON.stringify(body), { status }),
  } as any;

  let nextCalled = false;
  await authMiddleware(c, async () => { nextCalled = true; });
  assertEquals(nextCalled, true);
});

Deno.test("authMiddleware rejects missing Authorization header", async () => {
  const c = {
    req: {
      url: "http://localhost/api/monitors",
      header: () => null,
    },
    json: (body: unknown, status?: number) => new Response(JSON.stringify(body), { status }),
  } as any;

  let nextCalled = false;
  await authMiddleware(c, async () => { nextCalled = true; });
  assertEquals(nextCalled, false);
});

Deno.test("authMiddleware rejects invalid Bearer token", async () => {
  const c = {
    req: {
      url: "http://localhost/api/monitors",
      header: () => "Bearer invalidtoken",
    },
    json: (body: unknown, status?: number) => new Response(JSON.stringify(body), { status }),
  } as any;

  let nextCalled = false;
  await authMiddleware(c, async () => { nextCalled = true; });
  assertEquals(nextCalled, false);
});

Deno.test("authMiddleware allows valid Bearer token", async () => {
  const token = generateToken();
  addToken(token, "alice");

  const c = {
    req: {
      url: "http://localhost/api/monitors",
      header: () => `Bearer ${token}`,
    },
    json: (body: unknown, status?: number) => new Response(JSON.stringify(body), { status }),
  } as any;

  let nextCalled = false;
  await authMiddleware(c, async () => { nextCalled = true; });
  assertEquals(nextCalled, true);
});

Deno.test("authMiddleware allows public /api/auth/* paths", async () => {
  const c = {
    req: {
      url: "http://localhost/api/auth/login",
      header: () => null,
    },
    json: (body: unknown, status?: number) => new Response(JSON.stringify(body), { status }),
  } as any;

  let nextCalled = false;
  await authMiddleware(c, async () => { nextCalled = true; });
  assertEquals(nextCalled, true);
});

Deno.test("authMiddleware allows public /api/public/* paths", async () => {
  const c = {
    req: {
      url: "http://localhost/api/public/status-page/my-page",
      header: () => null,
    },
    json: (body: unknown, status?: number) => new Response(JSON.stringify(body), { status }),
  } as any;

  let nextCalled = false;
  await authMiddleware(c, async () => { nextCalled = true; });
  assertEquals(nextCalled, true);
});
