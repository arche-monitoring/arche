import { assertEquals } from "@std/assert";
import { fetchFavicon } from "./favicon.ts";

Deno.test("fetchFavicon returns null for invalid domain", async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (_input: URL | RequestInfo, _init?: RequestInit) => {
    throw new TypeError("fetch failed");
  };

  try {
    const result = await fetchFavicon("nonexistent.invalid");
    assertEquals(result, null);
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("fetchFavicon falls through to null when all sources fail", async () => {
  const origFetch = globalThis.fetch;
  let callCount = 0;
  globalThis.fetch = (input: URL | RequestInfo, _init?: RequestInit) => {
    callCount++;
    const urlStr = typeof input === "string" ? input : input.toString();
    if (urlStr.includes("favicon.ico") || urlStr.includes("google.com/s2/favicons")) {
      return new Response("not found", { status: 404 });
    }
    return new Response("<html><head></head></html>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  };

  try {
    const result = await fetchFavicon("http://example.com");
    assertEquals(result, null);
    assertEquals(callCount, 3);
  } finally {
    globalThis.fetch = origFetch;
  }
});
