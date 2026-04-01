import { Hono } from "hono";
import { authMiddleware, requireRole } from "../auth";
import { getAllUsers, updateUserRole, countManagersExcept } from "../db";
import type { AuthUser } from "../auth";

export const adminRoute = new Hono();

adminRoute.use("/admin/*", authMiddleware, requireRole("manager"));

adminRoute.get("/admin/users", (c) => c.json(getAllUsers()));

adminRoute.put("/admin/users/:id/role", async (c) => {
  const id = Number(c.req.param("id"));
  let body: { role?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }
  const { role } = body;
  if (role !== "worker" && role !== "manager") return c.json({ error: "role must be 'worker' or 'manager'" }, 400);
  if (role === "worker") {
    const otherManagers = countManagersExcept(id);
    if (otherManagers === 0) return c.json({ error: "Cannot demote the last manager" }, 400);
  }
  updateUserRole(id, role);
  return c.json({ ok: true });
});
