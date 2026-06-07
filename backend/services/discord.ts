import { loadConfig } from "../config.ts";
import { logger } from "../utils/logger.ts";

export async function sendDiscordAlert(message: string) {
  const config = loadConfig();
  if (!config.discordWebhookUrl) {
    logger.debug("Discord not configured, skipping alert");
    return;
  }

  try {
    const res = await fetch(config.discordWebhookUrl, {
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
