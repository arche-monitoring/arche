import { logger } from "../utils/logger.ts";
import type { CheckResult } from "./ping.ts";

interface HttpConfig {
  target: string;
  method: string;
  expectedStatus: number;
  timeout: number;
}

const BINARY_TYPES = [
  "image/",
  "video/",
  "audio/",
  "font/",
  "application/octet-stream",
  "application/pdf",
  "application/zip",
  "application/gzip",
  "application/x-tar",
  "application/x-gzip",
  "application/x-bzip2",
  "application/vnd.rar",
  "application/x-7z-compressed",
];

function isBinaryContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  return BINARY_TYPES.some((t) => ct.startsWith(t));
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
    const contentType = response.headers.get("content-type") ?? "";

    let responseBody: string | undefined;
    if (!isBinaryContentType(contentType)) {
      try {
        const text = await response.clone().text();
        if (text.length > 0) {
          responseBody = text.slice(0, 10_000);
        }
      } catch {
        // ignore read errors
      }
    }

    return {
      status: ok ? "up" : "down",
      responseTimeMs: elapsed,
      statusCode: response.status,
      responseBody,
      error: ok
        ? undefined
        : `Expected ${config.expectedStatus}, got ${response.status}`,
    };
  } catch (err) {
    logger.error(`HTTP error for ${config.target}:`, err);
    return { status: "error", error: String(err) };
  }
}
