import { Hono } from "hono";
import { getAllReports, getReportById, updateReport } from "../db";

export const reportsRoute = new Hono();

reportsRoute.get("/reports", (c) => {
  const reports = getAllReports();
  return c.json(reports);
});

reportsRoute.get("/reports/:id", (c) => {
  const id = Number(c.req.param("id"));
  const report = getReportById(id);

  if (!report) {
    return c.json({ error: "Report not found" }, 404);
  }

  return c.json(report);
});

reportsRoute.put("/reports/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{
    summary: string;
    tasksCompleted: string[];
    tasksInProgress: string[];
    blockers: string[];
  }>();

  const existing = getReportById(id);
  if (!existing) {
    return c.json({ error: "Report not found" }, 404);
  }

  const updated = updateReport(
    id,
    body.tasksCompleted,
    body.tasksInProgress,
    body.blockers,
    body.summary,
  );

  return c.json(updated);
});
