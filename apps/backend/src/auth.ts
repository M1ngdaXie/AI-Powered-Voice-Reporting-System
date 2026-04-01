import { sign, verify } from "hono/jwt";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import type { Context, Next } from "hono";

export interface AuthUser {
  userId: number;
  role: "worker" | "manager";
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const COOKIE_NAME = "auth_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: AuthUser): Promise<string> {
  return sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + 86400 },
    JWT_SECRET
  );
}

export function setAuthCookie(c: Context, token: string) {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "Strict",
    secure: false,
    path: "/",
    maxAge: 86400,
  });
}

export function clearAuthCookie(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  try {
    const payload = await verify(token, JWT_SECRET, "HS256") as AuthUser & { exp: number };
    c.set("user", { userId: payload.userId, role: payload.role, name: payload.name });
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}

export function requireRole(role: "worker" | "manager") {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as AuthUser;
    if (!user || user.role !== role) return c.json({ error: "Forbidden" }, 403);
    await next();
  };
}
