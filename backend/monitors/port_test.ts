import { assertEquals, assertExists } from "@std/assert";
import { checkPort } from "./port.ts";

Deno.test("checkPort returns down for unreachable host", async () => {
  const result = await checkPort("192.0.2.1", 9, 2);
  assertEquals(result.status, "down");
  assertExists(result.error);
});

Deno.test("checkPort returns down for invalid hostname", async () => {
  const result = await checkPort("nonexistent.invalid", 80, 2);
  assertEquals(result.status, "down");
});
