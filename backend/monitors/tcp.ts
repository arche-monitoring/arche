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

    const conn = await Deno.connect({
      hostname,
      port,
      signal: controller.signal,
    });
    clearTimeout(timer);

    let banner = "";
    try {
      const readController = new AbortController();
      const readTimer = setTimeout(() => readController.abort(), 2000);
      const buf = new Uint8Array(1024);
      const n = await conn.read(buf);
      clearTimeout(readTimer);
      if (n !== null) {
        banner = new TextDecoder().decode(buf.subarray(0, n)).trim();
      }
    } catch {
      // no banner / timeout reading banner
    }

    conn.close();

    const elapsed = Date.now() - start;
    return {
      status: "up",
      responseTimeMs: elapsed,
      responseBody: banner || undefined,
    };
  } catch (err) {
    logger.error(`TCP error for ${hostname}:${port}:`, err);
    return { status: "down", error: String(err) };
  }
}
