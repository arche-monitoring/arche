import { getDb } from "../database/client.ts";
import { checks, monitors } from "../database/schema.ts";
import { checkPing } from "../monitors/ping.ts";
import { checkHttp } from "../monitors/http.ts";
import { checkPort } from "../monitors/port.ts";
import { checkImap } from "../monitors/imap.ts";
import { checkSmtp } from "../monitors/smtp.ts";
import { checkDns } from "../monitors/dns.ts";
import { checkTcp } from "../monitors/tcp.ts";
import { sendTelegramAlert } from "./telegram.ts";
import { sendDiscordAlert } from "./discord.ts";
import { logger } from "../utils/logger.ts";
import { desc, eq } from "drizzle-orm";
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
    case "port":
      return await checkPort(
        monitor.target,
        monitor.port || 80,
        monitor.timeout ?? 30,
      );
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

let tickInterval: number | null = null;

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
const lastTime = new Date(raw.endsWith("Z") ? raw : raw.replace(" ", "T") + "Z").getTime();
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
            const msg = `🔴 **${monitor.name}** went down!\nType: ${monitor.type}\nTarget: ${monitor.target}\nError: ${
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
            const msg = `🟢 **${monitor.name}** is back up!\nType: ${monitor.type}\nTarget: ${monitor.target}`;
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
