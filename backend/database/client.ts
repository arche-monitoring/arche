import { DB } from "sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { loadConfig } from "../config.ts";
import { logger } from "../utils/logger.ts";

type Params = (string | number | boolean | null)[] | undefined;

let dbInstance: ReturnType<typeof drizzle> | null = null;
let rawDb: DB | null = null;

function initTables(db: DB) {
  db.execute(`
    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      target TEXT NOT NULL,
      port INTEGER,
      username TEXT,
      password TEXT,
      method TEXT DEFAULT 'GET',
      expected_status INTEGER DEFAULT 200,
      interval INTEGER DEFAULT 60,
      timeout INTEGER DEFAULT 30,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      response_time_ms INTEGER,
      status_code INTEGER,
      error_msg TEXT,
      checked_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.execute(
    "CREATE INDEX IF NOT EXISTS idx_checks_monitor_id ON checks(monitor_id)",
  );
  db.execute(
    "CREATE INDEX IF NOT EXISTS idx_checks_checked_at ON checks(checked_at)",
  );
  db.execute(
    "CREATE INDEX IF NOT EXISTS idx_monitors_active ON monitors(active)",
  );
}

export function getDb() {
  if (!dbInstance) {
    const config = loadConfig();
    const dir = config.dbPath.substring(0, config.dbPath.lastIndexOf("/"));
    if (dir) Deno.mkdirSync(dir, { recursive: true });

    rawDb = new DB(config.dbPath);
    rawDb.execute("PRAGMA journal_mode=WAL");
    rawDb.execute("PRAGMA foreign_keys=ON");

    initTables(rawDb);

    // deno-lint-ignore require-await
    dbInstance = drizzle(async (sql, params, method) => {
      try {
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
