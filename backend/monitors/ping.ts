import { logger } from "../utils/logger.ts";

export interface CheckResult {
  status: "up" | "down" | "error";
  responseTimeMs?: number;
  statusCode?: number;
  error?: string;
}

export async function checkPing(
  target: string,
  timeout: number,
): Promise<CheckResult> {
  target = target.replace(/^https?:\/\//i, "");
  const start = Date.now();
  try {
    const cmd = Deno.build.os === "windows"
      ? ["ping", "-n", "1", "-w", String(timeout * 1000), target]
      : ["ping", "-c", "1", "-W", String(timeout), target];

    const process = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: "null",
      stderr: "null",
    });

    const { success } = await process.output();
    const elapsed = Date.now() - start;

    if (success) {
      return { status: "up", responseTimeMs: elapsed };
    }
    return { status: "down", error: "Ping failed" };
  } catch (err) {
    logger.error(`Ping error for ${target}:`, err);
    return { status: "error", error: String(err) };
  }
}
