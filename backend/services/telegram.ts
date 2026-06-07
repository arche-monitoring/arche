import { getDb } from "../database/client.ts";
import { settings } from "../database/schema.ts";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger.ts";

async function getTelegramConfig(): Promise<{ token: string; chatId: string }> {
  try {
    const db = await getDb();
    const rows = await db.select().from(settings).where(
      eq(settings.key, "telegram_bot_token"),
    ).limit(1);
    const rows2 = await db.select().from(settings).where(
      eq(settings.key, "telegram_chat_id"),
    ).limit(1);
    return {
      token: rows.length > 0 ? rows[0].value : "",
      chatId: rows2.length > 0 ? rows2[0].value : "",
    };
  } catch {
    return { token: "", chatId: "" };
  }
}

export async function sendTelegramAlert(message: string) {
  const { token, chatId } = await getTelegramConfig();
  if (!token || !chatId) {
    logger.debug("Telegram not configured, skipping alert");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
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
