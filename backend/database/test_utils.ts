import { closeDb, getDb } from "./client.ts";

export async function setupTestDb(): Promise<{ path: string }> {
  const tmpPath = `/tmp/arche_test_${Date.now()}_${
    Math.random().toString(36).slice(2)
  }.db`;
  Deno.env.set("DB_PATH", tmpPath);
  closeDb();
  await getDb();
  return { path: tmpPath };
}

export function teardownTestDb(path: string) {
  closeDb();
  try {
    Deno.removeSync(path);
  } catch { /* ignore */ }
  try {
    Deno.removeSync(path + "-wal");
  } catch { /* ignore */ }
  try {
    Deno.removeSync(path + "-shm");
  } catch { /* ignore */ }
}
