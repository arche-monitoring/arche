import { logger } from "../utils/logger.ts";
import type { CheckResult } from "./ping.ts";

export async function checkTcp(
  hostname: string,
  port: number,
  timeout: number,
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout * 1000);

    const conn = await Deno.connect({ hostname, port, signal: controller.signal });
    clearTimeout(timer);
    conn.close();

    const elapsed = Date.now() - start;
    return { status: "up", responseTimeMs: elapsed };
  } catch (err) {
    logger.error(`TCP error for ${hostname}:${port}:`, err);
    return { status: "down", error: String(err) };
  }
}
