import { DB } from "sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { loadConfig } from "../config.ts";
import { logger } from "../utils/logger.ts";

type Params = (string | number | boolean | null)[] | undefined;

let dbInstance: ReturnType<typeof drizzle> | null = null;
let rawDb: DB | null = null;

export async function getDb() {
  if (!dbInstance) {
    const config = loadConfig();
    const dir = config.dbPath.substring(0, config.dbPath.lastIndexOf("/"));
    if (dir) Deno.mkdirSync(dir, { recursive: true });

    rawDb = new DB(config.dbPath);
    rawDb.execute("PRAGMA journal_mode=WAL");
    rawDb.execute("PRAGMA foreign_keys=ON");

    // deno-lint-ignore require-await
    dbInstance = drizzle(async (sql, params, method) => {
      try {
        console.log(
          "SQL:",
          sql,
          "PARAMS:",
          JSON.stringify(params),
          "METHOD:",
          method,
        );
        if (method === "values") {
          const rows = rawDb!.query(sql, params as Params);
          return { rows: rows as unknown as Record<string, unknown>[] };
        }
        const rows = rawDb!.queryEntries(sql, params as Params);
        return { rows: rows as Record<string, unknown>[] };
      } catch (e) {
        logger.error("SQL error:", e);
        throw e;
      }
    });

    // deno-lint-ignore require-await
    await migrate(dbInstance, async (queries) => {
      for (const query of queries) {
        rawDb!.execute(query);
      }
    }, { migrationsFolder: "./backend/database/drizzle" });

    logger.info(`Database initialized at ${config.dbPath}`);
  }
  return dbInstance;
}

export function closeDb() {
  if (rawDb) {
    rawDb.close();
    rawDb = null;
    dbInstance = null;
  }
}
