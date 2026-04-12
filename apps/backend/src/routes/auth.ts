import { Hono } from "hono";
import {
  authMiddleware,
  clearAuthCookie,
  hashPassword,
  setAuthCookie,
  signToken,
  verifyPassword,
} from "../auth";
import { getUserByEmail, insertUser } from "../db";

export const authRoute = new Hono();

authRoute.post("/auth/register", async (c) => {
  let body: { email?: string; name?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { email, name, password } = body;
  if (!email || !name || !password)
    return c.json({ error: "email, name, and password are required" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return c.json({ error: "Invalid email format" }, 400);
  if (password.length < 8)
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  if (!name.trim()) return c.json({ error: "Name cannot be empty" }, 400);
  const existing = await getUserByEmail(email);
  if (existing) return c.json({ error: "Email already registered" }, 409);
  const hash = await hashPassword(password);
  const userId = await insertUser(email, name.trim(), hash, "worker");
  const token = await signToken({ userId, role: "worker", name: name.trim() });
  setAuthCookie(c, token);
  return c.json({ userId, name: name.trim(), role: "worker" }, 201);
});

authRoute.post("/auth/login", async (c) => {
  let body: { email?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  const { email, password } = body;
  if (!email || !password)
    return c.json({ error: "Invalid email or password" }, 401);
  const user = await getUserByEmail(email);
  if (!user) return c.json({ error: "Invalid email or password" }, 401);
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return c.json({ error: "Invalid email or password" }, 401);
  const token = await signToken({
    userId: user.id,
    role: user.role as "worker" | "manager",
    name: user.name,
  });
  setAuthCookie(c, token);
  return c.json({ userId: user.id, name: user.name, role: user.role });
});

authRoute.post("/auth/logout", (c) => {
  clearAuthCookie(c);
  return c.json({ ok: true });
});

authRoute.get("/auth/me", authMiddleware, (c) => {
  return c.json(c.get("user"));
});
