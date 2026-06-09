import { checkHttp } from "./http.ts";

Deno.test("checkHttp returns up when status matches expected", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response("OK", { status: 200 }));

  try {
    const result = await checkHttp({
      target: "https://example.com",
      method: "GET",
      expectedStatus: 200,
      timeout: 5,
    });
    if (result.status !== "up") {
      throw new Error(`Expected up, got ${result.status}`);
    }
    if (result.statusCode !== 200) {
      throw new Error(`Expected 200, got ${result.statusCode}`);
    }
    if (result.responseTimeMs == null) {
      throw new Error(`Expected value to exist, got ${result.responseTimeMs}`);
    }
    if (typeof result.responseTimeMs !== "number") {
      throw new Error(`Expected number, got ${typeof result.responseTimeMs}`);
    }
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("checkHttp returns down when status mismatches", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(new Response("Not Found", { status: 404 }));

  try {
    const result = await checkHttp({
      target: "https://example.com/notfound",
      method: "GET",
      expectedStatus: 200,
      timeout: 5,
    });
    if (result.status !== "down") {
      throw new Error(`Expected down, got ${result.status}`);
    }
    if (result.statusCode !== 404) {
      throw new Error(`Expected 404, got ${result.statusCode}`);
    }
    if (result.error == null) {
      throw new Error(`Expected value to exist, got ${result.error}`);
    }
    if (result.error !== "Expected 200, got 404") {
      throw new Error(`Expected Expected 200, got 404, got ${result.error}`);
    }
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("checkHttp returns error on network failure", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new TypeError("fetch failed");
  };

  try {
    const result = await checkHttp({
      target: "https://nonexistent.example.com",
      method: "GET",
      expectedStatus: 200,
      timeout: 5,
    });
    if (result.status !== "error") {
      throw new Error(`Expected error, got ${result.status}`);
    }
    if (result.error == null) {
      throw new Error(`Expected value to exist, got ${result.error}`);
    }
    if (result.error !== "TypeError: fetch failed") {
      throw new Error(`Expected TypeError: fetch failed, got ${result.error}`);
    }
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("checkHttp works with POST method", async () => {
  const origFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedMethod = "";
  globalThis.fetch = (url, opts?: RequestInit) => {
    capturedUrl = url as string;
    capturedMethod = (opts?.method as string) || "GET";
    return Promise.resolve(new Response("Created", { status: 201 }));
  };

  try {
    const result = await checkHttp({
      target: "https://api.example.com/resource",
      method: "POST",
      expectedStatus: 201,
      timeout: 10,
    });
    if (result.status !== "up") {
      throw new Error(`Expected up, got ${result.status}`);
    }
    if (capturedUrl !== "https://api.example.com/resource") {
      throw new Error(
        `Expected https://api.example.com/resource, got ${capturedUrl}`,
      );
    }
    if (capturedMethod !== "POST") {
      throw new Error(`Expected POST, got ${capturedMethod}`);
    }
  } finally {
    globalThis.fetch = origFetch;
  }
});
