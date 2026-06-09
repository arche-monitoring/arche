import { checkPing } from "./ping.ts";

Deno.test("checkPing returns error when command fails", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const result = await checkPing("192.0.2.1", 1);
  if (result.status !== "down") {
    throw new Error(`Expected down, got ${result.status}`);
  }
  if (result.error == null) {
    throw new Error(`Expected value to exist, got ${result.error}`);
  }
});

Deno.test("checkPing returns error on invalid target", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const result = await checkPing(
    "invalid host that definitely does not exist.example.com",
    1,
  );
  if (result.status !== "down") {
    throw new Error(`Expected down, got ${result.status}`);
  }
  if (result.error == null) {
    throw new Error(`Expected value to exist, got ${result.error}`);
  }
});
