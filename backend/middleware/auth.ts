import type { Context, Next } from "hono";
import * as jose from "jose";

let jwtSecret: Uint8Array | null = null;

export function setJwtSecret(secret: string): void {
  jwtSecret = new TextEncoder().encode(secret);
}

function getJwtKey(): Uint8Array {
  if (jwtSecret) return jwtSecret;
  throw new Error(
    "JWT secret not configured. Call setJwtSecret() before using auth.",
  );
}

const TOKEN_EXPIRY = "7d";

export async function signToken(username: string): Promise<string> {
  const secret = getJwtKey();
  return await new jose.SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const secret = getJwtKey();
    const { payload } = await jose.jwtVerify(token, secret);
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

const PUBLIC_PATHS = ["/api/auth", "/api/health", "/api/public"];

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
  const username = await verifyToken(token);
  if (!username) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
}
