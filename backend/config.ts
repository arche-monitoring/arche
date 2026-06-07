export interface Config {
  port: number;
  dbPath: string;
  telegramBotToken: string;
  telegramChatId: string;
  discordWebhookUrl: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(Deno.env.get("PORT") || "3001", 10),
    dbPath: Deno.env.get("DB_PATH") || "./data/arche.db",
    telegramBotToken: Deno.env.get("TELEGRAM_BOT_TOKEN") || "",
    telegramChatId: Deno.env.get("TELEGRAM_CHAT_ID") || "",
    discordWebhookUrl: Deno.env.get("DISCORD_WEBHOOK_URL") || "",
  };
}
