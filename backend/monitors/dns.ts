import { logger } from "../utils/logger.ts";
import type { CheckResult } from "./ping.ts";

function formatDnsRecords(records: unknown): string {
  if (Array.isArray(records)) {
    if (records.length === 0) return "No records found";
    if (typeof records[0] === "string") {
      return (records as string[]).join(", ");
    }
    if (Array.isArray(records[0])) {
      return (records as string[][]).map((r) => r.join(" ")).join(", ");
    }
    return (records as Record<string, unknown>[]).map((r) =>
      JSON.stringify(r)
    ).join(", ");
  }
  if (records && typeof records === "object") {
    return JSON.stringify(records);
  }
  return String(records);
}

export async function checkDns(
  hostname: string,
  recordType: string,
  timeout: number,
): Promise<CheckResult> {
  const start = Date.now();
  try {
    // deno-lint-ignore no-explicit-any
    const records = await Deno.resolveDns(hostname, recordType as any, {
      signal: AbortSignal.timeout(timeout * 1000),
    });
    const elapsed = Date.now() - start;
    const body = formatDnsRecords(records);
    return { status: "up", responseTimeMs: elapsed, responseBody: body };
  } catch (err) {
    logger.error(`DNS error for ${hostname}:`, err);
    return { status: "down", error: String(err) };
  }
}
