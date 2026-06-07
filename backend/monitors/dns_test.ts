import { assertEquals, assertExists } from "@std/assert";
import { checkDns } from "./dns.ts";

Deno.test("checkDns returns up for valid hostname", async () => {
  const result = await checkDns("google.com", 5);
  assertEquals(result.status, "up");
  assertExists(result.responseTimeMs);
});

Deno.test("checkDns returns down for non-existent hostname", async () => {
  const result = await checkDns("nonexistent-hostname-12345.invalid", 5);
  assertEquals(result.status, "down");
  assertExists(result.error);
});
