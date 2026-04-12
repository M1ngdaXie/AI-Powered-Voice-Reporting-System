import { Hono } from "hono";
import { insertReport } from "../db";
import { requireRole } from "../auth";
import type { AuthUser } from "../auth";
import { uploadAudio, r2Enabled } from "../r2";
import { transcriptionQueue } from "../queue";
import { setReportJobId } from "../db";

type Variables = { user: AuthUser };
export const transcribeRoute = new Hono<{ Variables: Variables }>();

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — Whisper's limit

transcribeRoute.post("/transcribe", requireRole("worker"), async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("audio") as File | null;
  const user = c.get("user");
  const workerName = user.name;
  const userId = user.userId;

  if (!file) {
    return c.json({ error: "No audio file provided" }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "File too large. Maximum size is 25MB." }, 400);
  }

  // 1. Upload audio to R2 — required for the worker to process it
  if (!r2Enabled) {
    return c.json({ error: "R2 storage is not configured on this server." }, 503);
  }

  const buffer = await file.arrayBuffer();
  const audioKey = `audio/${userId}/${Date.now()}-${file.name}`;
  await uploadAudio(audioKey, buffer, file.type || "audio/webm");

  // 2. Insert placeholder report (processing_status = 'processing')
  const reportId = await insertReport(
    workerName,
    userId,
    [],
    [],
    [],
    "",
    "",
    audioKey,
    "processing",
  );

  // 3. Enqueue background job
  const job = await transcriptionQueue.add(
    "process",
    { reportId, audioKey, workerName, userId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  );

  await setReportJobId(reportId, job.id!);

  // 4. Return immediately — frontend will poll /api/jobs/:jobId
  return c.json({ jobId: job.id, reportId }, 202);
});
