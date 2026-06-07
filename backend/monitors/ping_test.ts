import { assertEquals, assertExists } from "@std/assert";
import { checkPing } from "./ping.ts";

Deno.test("checkPing returns error when command fails", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const result = await checkPing("192.0.2.1", 1);
  assertEquals(result.status, "down");
  assertExists(result.error);
});

Deno.test("checkPing returns error on invalid target", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const result = await checkPing(
    "invalid host that definitely does not exist.example.com",
    1,
  );
  assertEquals(result.status, "down");
  assertExists(result.error);
});
