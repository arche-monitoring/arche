import { getDb } from "../database/client.ts";
import { checks, monitors, settings } from "../database/schema.ts";
import { checkPing } from "../monitors/ping.ts";
import { checkHttp } from "../monitors/http.ts";
import { checkImap } from "../monitors/imap.ts";
import { checkSmtp } from "../monitors/smtp.ts";
import { checkDns } from "../monitors/dns.ts";
import { checkTcp } from "../monitors/tcp.ts";
import { sendTelegramAlert } from "./telegram.ts";
import { sendDiscordAlert } from "./discord.ts";
import { refreshMonitorFavicon } from "./favicon.ts";
import { logger } from "../utils/logger.ts";
import { desc, eq, lt } from "drizzle-orm";
import type { CheckResult } from "../monitors/ping.ts";

interface MonitorRow {
  id: number;
  name: string;
  type: string;
  target: string;
  port: number | null;
  username: string | null;
  password: string | null;
  method: string | null;
  expectedStatus: number | null;
  interval: number | null;
  timeout: number | null;
  active: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const previousStatuses: Record<number, string> = {};

async function getActiveMonitors(): Promise<MonitorRow[]> {
  const db = await getDb();
  return await db.select().from(monitors).where(eq(monitors.active, 1));
}

async function saveCheck(monitorId: number, result: CheckResult) {
  const db = await getDb();
  await db.insert(checks).values({
    monitorId,
    status: result.status,
    responseTimeMs: result.responseTimeMs ?? null,
    statusCode: result.statusCode ?? null,
    errorMsg: result.error ?? null,
    responseBody: result.responseBody ?? null,
    checkedAt: new Date().toISOString(),
  });
}

async function runCheck(monitor: MonitorRow): Promise<CheckResult> {
  switch (monitor.type) {
    case "ping":
      return await checkPing(monitor.target, monitor.timeout ?? 30);
    case "http":
      return await checkHttp({
        target: monitor.target,
        method: monitor.method || "GET",
        expectedStatus: monitor.expectedStatus || 200,
        timeout: monitor.timeout ?? 30,
      });
    case "imap":
      return await checkImap({
        host: monitor.target,
        port: monitor.port || 993,
        username: monitor.username || "",
        password: monitor.password || "",
        timeout: monitor.timeout ?? 30,
      });
    case "smtp":
      return await checkSmtp(
        monitor.target,
        monitor.port || 587,
        monitor.timeout ?? 30,
      );
    case "dns":
      return await checkDns(monitor.target, monitor.timeout ?? 30);
    case "tcp":
      return await checkTcp(
        monitor.target,
        monitor.port || 80,
        monitor.timeout ?? 30,
      );
    default:
      return {
        status: "error",
        error: `Unknown monitor type: ${monitor.type}`,
      };
  }
}

const RETENTION_CLEANUP_INTERVAL = 60; // cleanup every 60 ticks (every 10 minutes)
const FAVICON_REFRESH_INTERVAL = 3600; // check favicons every 3600 ticks (every 10 hours)

async function cleanupOldChecks() {
  try {
    const db = await getDb();
    const rows = await db.select()
      .from(settings)
      .where(eq(settings.key, "retention_days"))
      .limit(1);
    const retentionDays = rows.length > 0 ? parseInt(rows[0].value, 10) : 365;
    if (isNaN(retentionDays) || retentionDays < 1) return;

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
      .toISOString();
    await db.delete(checks)
      .where(lt(checks.checkedAt, cutoff));
    logger.info(`Cleaned up checks older than ${retentionDays} days`);
  } catch (err) {
    logger.error(`Retention cleanup failed: ${err}`);
  }
}

async function refreshStaleFavicons() {
  try {
    const db = await getDb();
    const allMonitors = await db.select().from(monitors);
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    for (const m of allMonitors) {
      const row = m as {
        id: number;
        favicon: string | null;
        faviconUpdatedAt: string | null;
      };
      if (
        !row.favicon || !row.faviconUpdatedAt || row.faviconUpdatedAt < cutoff
      ) {
        await refreshMonitorFavicon(row.id);
      }
    }
  } catch (err) {
    logger.error(`Favicon refresh failed: ${err}`);
  }
}

let tickInterval: number | null = null;
let tickCount = 0;

export function startScheduler() {
  const tickMs = 10_000;
  logger.info(`Scheduler started (tick every ${tickMs}ms)`);

  const runDueMonitors = async () => {
    try {
      const activeMonitors = await getActiveMonitors();
      const db = await getDb();

      for (const monitor of activeMonitors) {
        try {
          const lastCheck = await db.select({ checkedAt: checks.checkedAt })
            .from(checks)
            .where(eq(checks.monitorId, monitor.id))
            .orderBy(desc(checks.checkedAt))
            .limit(1);

          if (lastCheck.length > 0) {
            const raw = lastCheck[0].checkedAt!;
            const lastTime = new Date(
              raw.endsWith("Z") ? raw : raw.replace(" ", "T") + "Z",
            ).getTime();
            const elapsed = Date.now() - lastTime;
            if (elapsed < (monitor.interval ?? 60) * 1000) continue;
          }

          logger.info(
            `Checking ${monitor.name} (${monitor.type}:${monitor.target})`,
          );
          const result = await runCheck(monitor);
          await saveCheck(monitor.id, result);
          logger.info(`Result for ${monitor.name}: ${result.status}`);

          const prevStatus = previousStatuses[monitor.id];
          if (prevStatus && prevStatus === "up" && result.status !== "up") {
            const msg =
              `🔴 **${monitor.name}** went down!\nType: ${monitor.type}\nTarget: ${monitor.target}\nError: ${
                result.error || "Unreachable"
              }`;
            await sendTelegramAlert(
              `🔴 <b>${monitor.name}</b> went down!\nType: ${monitor.type}\nTarget: ${monitor.target}\nError: ${
                result.error || "Unreachable"
              }`,
            );
            await sendDiscordAlert(msg);
          }
          if (prevStatus && prevStatus !== "up" && result.status === "up") {
            const msg =
              `🟢 **${monitor.name}** is back up!\nType: ${monitor.type}\nTarget: ${monitor.target}`;
            await sendTelegramAlert(
              `🟢 <b>${monitor.name}</b> is back up!\nType: ${monitor.type}\nTarget: ${monitor.target}`,
            );
            await sendDiscordAlert(msg);
          }

          previousStatuses[monitor.id] = result.status;
        } catch (monitorErr) {
          logger.error(
            `Error checking ${monitor.name}: ${monitorErr}`,
          );
        }
      }

      tickCount++;
      if (tickCount % RETENTION_CLEANUP_INTERVAL === 0) {
        cleanupOldChecks();
      }
      if (tickCount % FAVICON_REFRESH_INTERVAL === 0) {
        refreshStaleFavicons();
      }
    } catch (err) {
      logger.error(`Scheduler tick failed: ${err}`);
    }
  };

  runDueMonitors();
  tickInterval = Number(setInterval(runDueMonitors, tickMs)) as number;
}

export function stopScheduler() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}
