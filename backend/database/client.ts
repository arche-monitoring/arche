import { DB } from "sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { loadConfig } from "../config.ts";
import { logger } from "../utils/logger.ts";

const config = loadConfig();
const dir = config.dbPath.substring(0, config.dbPath.lastIndexOf("/"));
if (dir) Deno.mkdirSync(dir, { recursive: true });

const rawDb = new DB(config.dbPath);
rawDb.execute("PRAGMA journal_mode=WAL");
rawDb.execute("PRAGMA foreign_keys=ON");

// deno-lint-ignore require-await
export const db = drizzle(async (sql, params, _method) => {
  try {
    const rows = rawDb.query(sql, params);
    return { rows: rows as unknown as Record<string, unknown>[] };
  } catch (e) {
    logger.error("SQL error:", e);
    throw e;
  }
});

await migrate(
  db,
  // deno-lint-ignore require-await
  async (queries) => {
    for (const query of queries) {
      rawDb.execute(query);
    }
  },
  { migrationsFolder: "./backend/database/drizzle" },
);

logger.info(`Database initialized at ${config.dbPath}`);
