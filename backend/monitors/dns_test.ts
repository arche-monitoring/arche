import { checkDns } from "./dns.ts";

Deno.test("checkDns returns up for valid hostname", async () => {
  const result = await checkDns("google.com", "A", 5);
  if (result.status !== "up") {
    throw new Error(`Expected up, got ${result.status}`);
  }
  if (result.responseTimeMs == null) {
    throw new Error(`Expected value to exist, got ${result.responseTimeMs}`);
  }
});

Deno.test("checkDns returns down for non-existent hostname", async () => {
  const result = await checkDns("nonexistent-hostname-12345.invalid", "A", 5);
  if (result.status !== "down") {
    throw new Error(`Expected down, got ${result.status}`);
  }
  if (result.error == null) {
    throw new Error(`Expected value to exist, got ${result.error}`);
  }
});
