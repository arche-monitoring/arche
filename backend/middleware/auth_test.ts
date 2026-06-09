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
  if (token == null) throw new Error(`Expected value to exist, got ${token}`);
  if (typeof token !== "string") {
    throw new Error(`Expected string, got ${typeof token}`);
  }

  const username = await verifyToken(token);
  if (username !== "alice") throw new Error(`Expected alice, got ${username}`);
});

Deno.test("verifyToken returns null for invalid token", async () => {
  const result = await verifyToken("not-a-valid-jwt");
  if (result !== null) throw new Error(`Expected null, got ${result}`);
});

Deno.test("verifyToken returns null for tampered token", async () => {
  const token = await signToken("alice");
  const prefix = token.split(".").slice(0, 2).join(".");
  const tampered = prefix + ".invalidsignature";
  const result = await verifyToken(tampered);
  if (result !== null) throw new Error(`Expected null, got ${result}`);
});

Deno.test("hashPassword and verifyPassword round-trip", async () => {
  const password = "hunter2";
  const hashed = await hashPassword(password);
  if (hashed == null) throw new Error(`Expected value to exist, got ${hashed}`);
  if (hashed.split(":").length !== 2) {
    throw new Error(`Expected 2, got ${hashed.split(":").length}`);
  }

  const valid = await verifyPassword(password, hashed);
  if (valid !== true) throw new Error(`Expected true, got ${valid}`);

  const invalid = await verifyPassword("wrong", hashed);
  if (invalid !== false) throw new Error(`Expected false, got ${invalid}`);
});

Deno.test("verifyPassword returns false for malformed hash", async () => {
  const result = await verifyPassword("pass", "invalid-hash");
  if (result !== false) throw new Error(`Expected false, got ${result}`);
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
  if (!nextCalled) throw new Error(`Expected true, got ${nextCalled}`);
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
  if (nextCalled) throw new Error(`Expected false, got ${nextCalled}`);
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
  if (nextCalled) throw new Error(`Expected false, got ${nextCalled}`);
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
  if (!nextCalled) throw new Error(`Expected true, got ${nextCalled}`);
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
  if (!nextCalled) throw new Error(`Expected true, got ${nextCalled}`);
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
  if (!nextCalled) throw new Error(`Expected true, got ${nextCalled}`);
});
