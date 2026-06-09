import { loadConfig } from "./config.ts";

Deno.test("config returns default values when env not set", () => {
  const origPort = Deno.env.get("PORT");
  const origDbPath = Deno.env.get("DB_PATH");
  Deno.env.delete("PORT");
  Deno.env.delete("DB_PATH");

  try {
    const config = loadConfig();
    if (config.port !== 3000) {
      throw new Error(`Expected 3000, got ${config.port}`);
    }
    if (config.dbPath !== "./data/arche.db") {
      throw new Error(`Expected ./data/arche.db, got ${config.dbPath}`);
    }
  } finally {
    if (origPort) Deno.env.set("PORT", origPort);
    if (origDbPath) Deno.env.set("DB_PATH", origDbPath);
  }
});

Deno.test("config reads PORT and DB_PATH env vars", () => {
  const origPort = Deno.env.get("PORT");
  const origDbPath = Deno.env.get("DB_PATH");
  Deno.env.set("PORT", "4000");
  Deno.env.set("DB_PATH", "/tmp/test.db");

  try {
    const config = loadConfig();
    if (config.port !== 4000) {
      throw new Error(`Expected 4000, got ${config.port}`);
    }
    if (config.dbPath !== "/tmp/test.db") {
      throw new Error(`Expected /tmp/test.db, got ${config.dbPath}`);
    }
  } finally {
    if (origPort) Deno.env.set("PORT", origPort);
    else Deno.env.delete("PORT");
    if (origDbPath) Deno.env.set("DB_PATH", origDbPath);
    else Deno.env.delete("DB_PATH");
  }
});
