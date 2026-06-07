export interface Config {
  port: number;
  dbPath: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(Deno.env.get("PORT") || "3001", 10),
    dbPath: Deno.env.get("DB_PATH") || "./data/arche.db",
  };
}
