import { logger } from "../utils/logger.ts";

function extractDomain(target: string): string {
  try {
    const url = target.startsWith("http") ? target : `https://${target}`;
    return new URL(url).hostname;
  } catch {
    return target;
  }
}

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:${blob.type || "image/x-icon"};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function fetchFavicon(target: string): Promise<string | null> {
  const domain = extractDomain(target);

  const directUrl = `https://${domain}/favicon.ico`;
  const result = await fetchAsBase64(directUrl);
  if (result) return result;

  try {
    const resp = await fetch(`https://${domain}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const html = await resp.text();
      const match = html.match(
        /<link[^>]+rel=["']?(?:icon|shortcut icon|apple-touch-icon)["']?[^>]+href=["']([^"']+)["']/i,
      );
      if (match) {
        let iconUrl = match[1];
        if (iconUrl.startsWith("//")) {
          iconUrl = `https:${iconUrl}`;
        } else if (!iconUrl.startsWith("http")) {
          iconUrl = `https://${domain}${
            iconUrl.startsWith("/") ? "" : "/"
          }${iconUrl}`;
        }
        const iconResult = await fetchAsBase64(iconUrl);
        if (iconResult) return iconResult;
      }
    }
  } catch {
    // fall through to Google fallback
  }

  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const googleResult = await fetchAsBase64(googleUrl);
  if (googleResult) return googleResult;

  return null;
}

export async function refreshMonitorFavicon(
  monitorId: number,
): Promise<string | null> {
  const { db } = await import("../database/client.ts");
  const { monitors } = await import("../database/schema.ts");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(monitors).where(
    eq(monitors.id, monitorId),
  );
  if (rows.length === 0) return null;
  const monitor = rows[0] as { target: string };
  const favicon = await fetchFavicon(monitor.target);
  const now = new Date().toISOString();
  await db.update(monitors)
    .set({
      favicon: favicon,
      faviconUpdatedAt: now,
    } as Record<string, unknown>)
    .where(eq(monitors.id, monitorId));
  if (favicon) {
    logger.info(`Fetched favicon for monitor ${monitorId}`);
  } else {
    logger.info(`No favicon found for monitor ${monitorId}`);
  }
  return favicon;
}

export async function refreshAllFavicons(): Promise<void> {
  const { db } = await import("../database/client.ts");
  const { monitors } = await import("../database/schema.ts");
  const allMonitors = await db.select().from(monitors);
  for (const m of allMonitors) {
    const monitor = m as { id: number };
    await refreshMonitorFavicon(monitor.id);
  }
  logger.info("Refreshed all favicons");
}
