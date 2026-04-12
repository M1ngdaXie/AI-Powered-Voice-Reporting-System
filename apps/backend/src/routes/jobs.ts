import { Hono } from "hono";
import { Job } from "bullmq";
import { transcriptionQueue } from "../queue";
import { getReportById } from "../db";
import type { AuthUser } from "../auth";

type Variables = { user: AuthUser };
export const jobsRoute = new Hono<{ Variables: Variables }>();

// GET /api/jobs/:jobId — poll for transcription job status
jobsRoute.get("/jobs/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const job = await Job.fromId(transcriptionQueue, jobId);

  if (!job) return c.json({ error: "Job not found" }, 404);

  const state = await job.getState();
  const reportId = job.data.reportId as number;

  if (state === "completed") {
    const report = await getReportById(reportId);
    return c.json({ status: "done", reportId, report });
  }

  if (state === "failed") {
    return c.json({ status: "failed", reportId, error: job.failedReason ?? "Processing failed" });
  }

  // waiting, active, delayed, prioritized
  return c.json({ status: "processing", reportId });
});
