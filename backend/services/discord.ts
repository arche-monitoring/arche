import { db } from "../database/client.ts";
import { settings } from "../database/schema.ts";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger.ts";

async function getWebhookUrl(): Promise<string> {
  try {
    const row = await db.select().from(settings).where(
      eq(settings.key, "discord_webhook_url"),
    ).limit(1);
    if (row.length > 0 && row[0].value) return row[0].value;
  } catch {
    // ignore DB errors
  }

  return "";
}

export async function sendDiscordAlert(message: string) {
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) {
    logger.debug("Discord not configured, skipping alert");
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("Discord webhook error:", body);
    } else {
      logger.info("Discord alert sent");
    }
  } catch (err) {
    logger.error("Failed to send Discord alert:", err);
  }
}
