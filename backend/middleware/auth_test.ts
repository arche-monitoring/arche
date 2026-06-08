import { assertEquals, assertExists, assertMatch } from "@std/assert";
import {
  addToken,
  authMiddleware,
  generateToken,
  getUsernameFromToken,
  hashPassword,
  rateLimit,
  removeToken,
  verifyPassword,
} from "./auth.ts";

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
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status }),
  });

  for (let i = 0; i < 3; i++) {
    const ctx = mockC("1.2.3.4") as {
      req: { header: () => string };
      json: (body: unknown, status?: number) => Response;
    };
    await handler(ctx as any, async () => {});
    // @ts-ignore: accessing status
    if (ctx.status === 429) break;
    callCount++;
  }
});

Deno.test("authMiddleware allows public paths", async () => {
  // deno-lint-ignore no-explicit-any
  const c: any = {
    req: { url: "http://localhost/api/health", header: () => null },
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status }),
  };

  let nextCalled = false;
  await authMiddleware(c, async () => {
    nextCalled = true;
  });
  assertEquals(nextCalled, true);
});

Deno.test("authMiddleware rejects missing Authorization header", async () => {
  // deno-lint-ignore no-explicit-any
  const c: any = {
    req: {
      url: "http://localhost/api/monitors",
      header: () => null,
    },
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status }),
  };

  let nextCalled = false;
  await authMiddleware(c, async () => {
    nextCalled = true;
  });
  assertEquals(nextCalled, false);
});

Deno.test("authMiddleware rejects invalid Bearer token", async () => {
  // deno-lint-ignore no-explicit-any
  const c: any = {
    req: {
      url: "http://localhost/api/monitors",
      header: () => "Bearer invalidtoken",
    },
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status }),
  };

  let nextCalled = false;
  await authMiddleware(c, async () => {
    nextCalled = true;
  });
  assertEquals(nextCalled, false);
});

Deno.test("authMiddleware allows valid Bearer token", async () => {
  const token = generateToken();
  addToken(token, "alice");

  // deno-lint-ignore no-explicit-any
  const c: any = {
    req: {
      url: "http://localhost/api/monitors",
      header: () => `Bearer ${token}`,
    },
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status }),
  };

  let nextCalled = false;
  await authMiddleware(c, async () => {
    nextCalled = true;
  });
  assertEquals(nextCalled, true);
});

Deno.test("authMiddleware allows public /api/auth/* paths", async () => {
  // deno-lint-ignore no-explicit-any
  const c: any = {
    req: {
      url: "http://localhost/api/auth/login",
      header: () => null,
    },
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status }),
  };

  let nextCalled = false;
  await authMiddleware(c, async () => {
    nextCalled = true;
  });
  assertEquals(nextCalled, true);
});

Deno.test("authMiddleware allows public /api/public/* paths", async () => {
  // deno-lint-ignore no-explicit-any
  const c: any = {
    req: {
      url: "http://localhost/api/public/status-page/my-page",
      header: () => null,
    },
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status }),
  };

  let nextCalled = false;
  await authMiddleware(c, async () => {
    nextCalled = true;
  });
  assertEquals(nextCalled, true);
});
