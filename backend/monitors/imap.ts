import { ImapFlow } from "imapflow";
import { logger } from "../utils/logger.ts";
import type { CheckResult } from "./ping.ts";

interface ImapConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  timeout: number;
}

export async function checkImap(config: ImapConfig): Promise<CheckResult> {
  const start = Date.now();
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.port === 993,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false,
  });

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("IMAP connection timeout")),
        config.timeout * 1000,
      )
    );

    await Promise.race([client.connect(), timeoutPromise]);
    const elapsed = Date.now() - start;
    await client.logout();

    return { status: "up", responseTimeMs: elapsed };
  } catch (err) {
    logger.error(`IMAP error for ${config.host}:${config.port}:`, err);
    try {
      await client.logout();
    } catch { /* ignore */ }
    return { status: "down", error: String(err) };
  }
}
