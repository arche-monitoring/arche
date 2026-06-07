import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./backend/database/schema.ts",
  out: "./backend/database/drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/alice.db",
  },
});
