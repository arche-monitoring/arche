import { assertEquals, assertExists } from "@std/assert";
import { checkHttp } from "./http.ts";

Deno.test("checkHttp returns up when status matches expected", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("OK", { status: 200 });

  try {
    const result = await checkHttp({
      target: "https://example.com",
      method: "GET",
      expectedStatus: 200,
      timeout: 5,
    });
    assertEquals(result.status, "up");
    assertEquals(result.statusCode, 200);
    assertExists(result.responseTimeMs);
    assertEquals(typeof result.responseTimeMs, "number");
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("checkHttp returns down when status mismatches", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("Not Found", { status: 404 });

  try {
    const result = await checkHttp({
      target: "https://example.com/notfound",
      method: "GET",
      expectedStatus: 200,
      timeout: 5,
    });
    assertEquals(result.status, "down");
    assertEquals(result.statusCode, 404);
    assertExists(result.error);
    assertEquals(result.error, "Expected 200, got 404");
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
    assertEquals(result.status, "error");
    assertExists(result.error);
    assertEquals(result.error, "TypeError: fetch failed");
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("checkHttp works with POST method", async () => {
  const origFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedMethod = "";
  globalThis.fetch = async (url, opts?: RequestInit) => {
    capturedUrl = url as string;
    capturedMethod = (opts?.method as string) || "GET";
    return new Response("Created", { status: 201 });
  };

  try {
    const result = await checkHttp({
      target: "https://api.example.com/resource",
      method: "POST",
      expectedStatus: 201,
      timeout: 10,
    });
    assertEquals(result.status, "up");
    assertEquals(capturedUrl, "https://api.example.com/resource");
    assertEquals(capturedMethod, "POST");
  } finally {
    globalThis.fetch = origFetch;
  }
});
