import type { Context, Next } from "hono";

const tokens = new Map<string, { username: string; expiresAt: number }>();
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const PUBLIC_PATHS = ["/api/auth", "/api/health", "/api/public"];

export function addToken(token: string, username: string): void {
  tokens.set(token, { username, expiresAt: Date.now() + TOKEN_EXPIRY_MS });
}

export function removeToken(token: string): void {
  tokens.delete(token);
}

export function getUsernameFromToken(token: string): string | null {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokens.delete(token);
    return null;
  }
  return entry.username;
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  const hash = new Uint8Array(bits);
  const toHex = (a: Uint8Array) =>
    Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  const hash = new Uint8Array(bits);
  const computedHex = Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computedHex === hashHex;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxAttempts: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      "unknown";
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (entry.count >= maxAttempts) {
      return c.json(
        { error: "Too many attempts. Please try again later." },
        429,
      );
    }

    entry.count++;
    await next();
  };
}

export async function authMiddleware(c: Context, next: Next) {
  const url = new URL(c.req.url);
  const pathname = url.pathname;

  for (const prefix of PUBLIC_PATHS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      await next();
      return;
    }
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  if (!getUsernameFromToken(token)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
}
