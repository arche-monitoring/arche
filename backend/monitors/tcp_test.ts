import { assertEquals, assertExists } from "@std/assert";
import { checkTcp } from "./tcp.ts";

Deno.test("checkTcp returns down for unreachable host", async () => {
  const result = await checkTcp("192.0.2.1", 9, 2);
  assertEquals(result.status, "down");
  assertExists(result.error);
});

Deno.test("checkTcp returns down for invalid hostname", async () => {
  const result = await checkTcp("nonexistent.invalid", 80, 2);
  assertEquals(result.status, "down");
});
