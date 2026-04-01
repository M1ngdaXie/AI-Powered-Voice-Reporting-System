import { Hono } from "hono";
import { getAllReports, getReportById, updateReport, getReportsByUserId } from "../db";
import { requireRole } from "../auth";
import type { AuthUser } from "../auth";

export const reportsRoute = new Hono();

// GET /api/reports/mine — worker's own reports (must be before /:id)
reportsRoute.get("/reports/mine", requireRole("worker"), (c) => {
  const user = c.get("user") as AuthUser;
  return c.json(getReportsByUserId(user.userId));
});

// GET /api/reports — manager only
reportsRoute.get("/reports", requireRole("manager"), (c) => c.json(getAllReports()));

// GET /api/reports/:id — manager or owner
reportsRoute.get("/reports/:id", (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user") as AuthUser;
  const report = getReportById(id);
  if (!report) return c.json({ error: "Not found" }, 404);
  if (user.role === "worker" && report.userId !== user.userId) return c.json({ error: "Forbidden" }, 403);
  return c.json(report);
});

// PUT /api/reports/:id — manager or owner
reportsRoute.put("/reports/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const user = c.get("user") as AuthUser;
  const existing = getReportById(id);
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (user.role === "worker" && existing.userId !== user.userId) return c.json({ error: "Forbidden" }, 403);
  const body = await c.req.json();
  const updated = updateReport(
    id,
    body.tasksCompleted ?? existing.tasksCompleted,
    body.tasksInProgress ?? existing.tasksInProgress,
    body.blockers ?? existing.blockers,
    body.summary ?? existing.summary,
  );
  return c.json(updated);
});
