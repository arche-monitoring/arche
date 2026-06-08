import { logger } from "../utils/logger.ts";
import type { CheckResult } from "./ping.ts";

export async function checkSmtp(
  hostname: string,
  port: number,
  timeout: number,
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const conn = port === 465
      ? await Deno.connectTls({ hostname, port })
      : await Deno.connect({ hostname, port });

    const timer = setTimeout(() => {
      try {
        conn.close();
      } catch { /* ignore */ }
    }, timeout * 1000);
    const buf = new Uint8Array(4096);
    const responseParts: string[] = [];

    const write = async (cmd: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(cmd + "\r\n");
      let offset = 0;
      while (offset < data.length) {
        const n = await conn.write(data.slice(offset));
        if (n === null) throw new Error("Write failed");
        offset += n;
      }
    };

    const readUntil = async (): Promise<void> => {
      const decoder = new TextDecoder();
      while (true) {
        const n = await conn.read(buf);
        if (n === null) break;
        const text = decoder.decode(buf.subarray(0, n));
        responseParts.push(text.trim());
        if (text.includes("\r\n")) break;
      }
    };

    await readUntil();
    await write(`EHLO arche-monitor`);
    await readUntil();

    if (port === 587) {
      await write("STARTTLS");
      await readUntil();
    }

    await write("QUIT");
    await readUntil();

    clearTimeout(timer);
    conn.close();

    const elapsed = Date.now() - start;
    return {
      status: "up",
      responseTimeMs: elapsed,
      responseBody: responseParts.join("\n") || undefined,
    };
  } catch (err) {
    logger.error(`SMTP error for ${hostname}:${port}:`, err);
    return { status: "down", error: String(err) };
  }
}
