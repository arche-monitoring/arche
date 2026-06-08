import { logger } from "../utils/logger.ts";
import type { CheckResult } from "./ping.ts";

export async function checkDns(
  hostname: string,
  _timeout: number,
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const records = await Deno.resolveDns(hostname, "A");
    const elapsed = Date.now() - start;
    const body = records.join(", ");
    if (records.length > 0) {
      return { status: "up", responseTimeMs: elapsed, responseBody: body };
    }
    return { status: "down", error: "No A records found", responseBody: body };
  } catch (err) {
    logger.error(`DNS error for ${hostname}:`, err);
    return { status: "down", error: String(err) };
  }
}
