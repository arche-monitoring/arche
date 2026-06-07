import { logger } from "../utils/logger.ts";
import type { CheckResult } from "./ping.ts";

export async function checkPort(
  hostname: string,
  port: number,
  _timeout: number,
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const conn = await Deno.connect({ hostname, port });
    conn.close();
    const elapsed = Date.now() - start;
    return { status: "up", responseTimeMs: elapsed };
  } catch (err) {
    logger.error(`Port check error for ${hostname}:${port}:`, err);
    return { status: "down", error: String(err) };
  }
}
