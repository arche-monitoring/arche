import { logger } from "../utils/logger.ts";
import type { CheckResult } from "./ping.ts";

interface HttpConfig {
  target: string;
  method: string;
  expectedStatus: number;
  timeout: number;
}

export async function checkHttp(config: HttpConfig): Promise<CheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeout * 1000);

    const response = await fetch(config.target, {
      method: config.method,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const elapsed = Date.now() - start;
    const ok = response.status === config.expectedStatus;

    return {
      status: ok ? "up" : "down",
      responseTimeMs: elapsed,
      statusCode: response.status,
      error: ok
        ? undefined
        : `Expected ${config.expectedStatus}, got ${response.status}`,
    };
  } catch (err) {
    logger.error(`HTTP error for ${config.target}:`, err);
    return { status: "error", error: String(err) };
  }
}
