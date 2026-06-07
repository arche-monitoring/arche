import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const monitors = sqliteTable("monitors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  target: text("target").notNull(),
  port: integer("port"),
  username: text("username"),
  password: text("password"),
  method: text("method").default("GET"),
  expectedStatus: integer("expected_status").default(200),
  interval: integer("interval").default(60),
  timeout: integer("timeout").default(30),
  active: integer("active").default(1),
  favicon: text("favicon"),
  faviconUpdatedAt: text("favicon_updated_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const checks = sqliteTable("checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  monitorId: integer("monitor_id").notNull().references(() => monitors.id, {
    onDelete: "cascade",
  }),
  status: text("status").notNull(),
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code"),
  errorMsg: text("error_msg"),
  checkedAt: text("checked_at").default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
