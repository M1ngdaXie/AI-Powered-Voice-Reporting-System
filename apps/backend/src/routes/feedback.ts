import { Hono } from "hono";
import {
  insertFeedback,
  getAllFeedback,
  getFeedbackSummary,
  hasFeedbackForReport,
  getReportById,
} from "../db";
import { requireRole } from "../auth";

export const feedbackRoute = new Hono();

const VALID_ACCURATE = ["Yes", "Somewhat", "No"];
const VALID_EASIER = ["Much easier", "About the same", "Harder"];
const MAX_COMMENT_LENGTH = 2000;

feedbackRoute.post("/feedback", async (c) => {
  let body: { reportId?: number; accurate?: string; easier?: string; comment?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.reportId || !body.accurate || !body.easier) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  if (!VALID_ACCURATE.includes(body.accurate)) {
    return c.json({ error: `Invalid value for 'accurate'. Must be one of: ${VALID_ACCURATE.join(", ")}` }, 400);
  }

  if (!VALID_EASIER.includes(body.easier)) {
    return c.json({ error: `Invalid value for 'easier'. Must be one of: ${VALID_EASIER.join(", ")}` }, 400);
  }

  const comment = (body.comment ?? "").slice(0, MAX_COMMENT_LENGTH);

  const report = getReportById(body.reportId);
  if (!report) {
    return c.json({ error: "Report not found" }, 404);
  }

  if (hasFeedbackForReport(body.reportId)) {
    return c.json({ error: "Feedback already submitted for this report" }, 409);
  }

  const id = insertFeedback(body.reportId, body.accurate, body.easier, comment);
  return c.json({ id }, 201);
});

feedbackRoute.get("/feedback/check/:reportId", (c) => {
  const reportId = Number(c.req.param("reportId"));
  return c.json({ submitted: hasFeedbackForReport(reportId) });
});

feedbackRoute.get("/feedback", requireRole("manager"), (c) => {
  const entries = getAllFeedback();
  const summary = getFeedbackSummary();
  return c.json({ summary, entries });
});
