import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const sqlite = new Database("sqlite.db");
const db = drizzle({ client: sqlite });

migrate(db, { migrationsFolder: "./backend/database/drizzle" });

export { db };
