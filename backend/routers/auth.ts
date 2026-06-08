import { Hono } from "hono";
import { db } from "../database/client.ts";
import { settings } from "../database/schema.ts";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  rateLimit,
  signToken,
  verifyPassword,
  verifyToken,
} from "../middleware/auth.ts";

const router = new Hono();

async function getAuthSettings() {
  const rows = await db.select().from(settings).where(
    eq(settings.key, "auth_username"),
  );
  const pwdRows = await db.select().from(settings).where(
    eq(settings.key, "auth_password_hash"),
  );
  const username = rows[0]?.value || "";
  const passwordHash = pwdRows[0]?.value || "";
  return {
    username,
    passwordHash,
    isConfigured: !!(username && passwordHash),
  };
}

router.post("/login", rateLimit(5, 60_000), async (c) => {
  const { username, password } = await c.req.json() as {
    username: string;
    password: string;
  };
  if (!username || !password) {
    return c.json({ error: "Username and password required" }, 400);
  }

  const auth = await getAuthSettings();

  if (!auth.isConfigured) {
    return c.json(
      { error: "Authentication not configured. Please run setup first." },
      400,
    );
  }

  if (username !== auth.username) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const valid = await verifyPassword(password, auth.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid username or password" }, 401);
  }

  const token = await signToken(username);
  return c.json({ token, username });
});

router.post("/logout", (c) => {
  return c.json({ success: true });
});

router.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const username = await verifyToken(authHeader.slice(7));
    if (username) {
      return c.json({ authenticated: true, username });
    }
  }

  const auth = await getAuthSettings();

  if (!auth.isConfigured) {
    return c.json({ authenticated: false, setupRequired: true });
  }

  return c.json({ authenticated: false, setupRequired: false });
});

router.post("/setup", rateLimit(3, 60_000), async (c) => {
  const auth = await getAuthSettings();

  if (auth.isConfigured) {
    return c.json({ error: "Authentication already configured" }, 400);
  }

  const { username, password } = await c.req.json() as {
    username: string;
    password: string;
  };
  if (!username || !password) {
    return c.json({ error: "Username and password required" }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  const passwordHash = await hashPassword(password);

  await db.insert(settings)
    .values({ key: "auth_username", value: username })
    .onConflictDoUpdate({ target: settings.key, set: { value: username } });
  await db.insert(settings)
    .values({ key: "auth_password_hash", value: passwordHash })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: passwordHash },
    });

  const token = await signToken(username);
  return c.json({ token, username });
});

router.post("/change-credentials", rateLimit(5, 60_000), async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice(7);
  const currentUser = await verifyToken(token);
  if (!currentUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { currentPassword, newUsername, newPassword } = await c.req.json() as {
    currentPassword: string;
    newUsername: string;
    newPassword: string;
  };

  if (!currentPassword || !newUsername || !newPassword) {
    return c.json(
      {
        error: "Current password, new username, and new password required",
      },
      400,
    );
  }

  const auth = await getAuthSettings();

  const valid = await verifyPassword(currentPassword, auth.passwordHash);
  if (!valid) {
    return c.json({ error: "Current password is incorrect" }, 401);
  }

  const newPasswordHash = await hashPassword(newPassword);

  await db.insert(settings)
    .values({ key: "auth_username", value: newUsername })
    .onConflictDoUpdate({ target: settings.key, set: { value: newUsername } });
  await db.insert(settings)
    .values({ key: "auth_password_hash", value: newPasswordHash })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: newPasswordHash },
    });

  const newToken = await signToken(newUsername);

  return c.json({ token: newToken, username: newUsername });
});

export { router as authRouter };
