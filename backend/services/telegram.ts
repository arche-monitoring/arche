import { loadConfig } from "../config.ts";
import { logger } from "../utils/logger.ts";

export async function sendTelegramAlert(message: string) {
  const config = loadConfig();
  if (!config.telegramBotToken || !config.telegramChatId) {
    logger.debug("Telegram not configured, skipping alert");
    return;
  }

  try {
    const url =
      `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("Telegram API error:", body);
    } else {
      logger.info("Telegram alert sent");
    }
  } catch (err) {
    logger.error("Failed to send Telegram alert:", err);
  }
}
