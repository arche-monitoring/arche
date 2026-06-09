import { checkTcp } from "./tcp.ts";

Deno.test("checkTcp returns down for unreachable host", async () => {
  const result = await checkTcp("192.0.2.1", 9, 2);
  if (result.status !== "down") {
    throw new Error(`Expected down, got ${result.status}`);
  }
  if (result.error == null) {
    throw new Error(`Expected value to exist, got ${result.error}`);
  }
});

Deno.test("checkTcp returns down for invalid hostname", async () => {
  const result = await checkTcp("nonexistent.invalid", 80, 2);
  if (result.status !== "down") {
    throw new Error(`Expected down, got ${result.status}`);
  }
});
