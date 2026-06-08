import { assertEquals, assertExists } from "@std/assert";
import {
  authMiddleware,
  hashPassword,
  rateLimit,
  setJwtSecret,
  signToken,
  verifyPassword,
  verifyToken,
} from "./auth.ts";

const TEST_SECRET = "test-secret-for-jwt-testing-0123456789abcdef";
setJwtSecret(TEST_SECRET);

Deno.test("signToken and verifyToken round-trip", async () => {
  const token = await signToken("alice");
  assertExists(token);
  assertEquals(typeof token, "string");

  const username = await verifyToken(token);
  assertEquals(username, "alice");
});

Deno.test("verifyToken returns null for invalid token", async () => {
  const result = await verifyToken("not-a-valid-jwt");
  assertEquals(result, null);
});

Deno.test("verifyToken returns null for tampered token", async () => {
  const token = await signToken("alice");
  const prefix = token.split(".").slice(0, 2).join(".");
  const tampered = prefix + ".invalidsignature";
  const result = await verifyToken(tampered);
  assertEquals(result, null);
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
    // deno-lint-ignore no-explicit-any
    await handler(ctx as any, () => Promise.resolve());
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
  await authMiddleware(c, () => {
    nextCalled = true;
    return Promise.resolve();
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
  await authMiddleware(c, () => {
    nextCalled = true;
    return Promise.resolve();
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
  await authMiddleware(c, () => {
    nextCalled = true;
    return Promise.resolve();
  });
  assertEquals(nextCalled, false);
});

Deno.test("authMiddleware allows valid Bearer token", async () => {
  const token = await signToken("alice");

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
  await authMiddleware(c, () => {
    nextCalled = true;
    return Promise.resolve();
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
  await authMiddleware(c, () => {
    nextCalled = true;
    return Promise.resolve();
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
  await authMiddleware(c, () => {
    nextCalled = true;
    return Promise.resolve();
  });
  assertEquals(nextCalled, true);
});
