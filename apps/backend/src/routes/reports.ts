import { Hono } from "hono";
import { getAllReports, getReportById, updateReport, submitReport, getReportsByUserId } from "../db";
import { requireRole } from "../auth";
import type { AuthUser } from "../auth";

type Variables = { user: AuthUser };
export const reportsRoute = new Hono<{ Variables: Variables }>();

// GET /api/reports/mine — worker's own reports (must be before /:id)
reportsRoute.get("/reports/mine", requireRole("worker"), async (c) => {
  const user = c.get("user") as AuthUser;
  return c.json(await getReportsByUserId(user.userId));
});

// GET /api/reports — manager only
reportsRoute.get("/reports", requireRole("manager"), async (c) => c.json(await getAllReports()));

// GET /api/reports/:id — manager or owner
reportsRoute.get("/reports/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user") as AuthUser;
  const report = await getReportById(id);
  if (!report) return c.json({ error: "Not found" }, 404);
  if (user.role === "worker" && report.userId !== user.userId) return c.json({ error: "Forbidden" }, 403);
  return c.json(report);
});

// PATCH /api/reports/:id/submit — worker (owner only)
reportsRoute.patch("/reports/:id/submit", async (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user") as AuthUser;
  const existing = await getReportById(id);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (user.role !== "worker" || existing.userId !== user.userId) return c.json({ error: "Forbidden" }, 403);
  return c.json(await submitReport(id));
});

// PUT /api/reports/:id — manager or owner
reportsRoute.put("/reports/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user") as AuthUser;
  const existing = await getReportById(id);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (user.role === "worker" && existing.userId !== user.userId) return c.json({ error: "Forbidden" }, 403);
  const body = await c.req.json();
  const updated = await updateReport(
    id,
    body.tasksCompleted ?? existing.tasksCompleted,
    body.tasksInProgress ?? existing.tasksInProgress,
    body.blockers ?? existing.blockers,
    body.summary ?? existing.summary,
  );
  return c.json(updated);
});
