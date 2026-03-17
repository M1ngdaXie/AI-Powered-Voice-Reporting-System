import { Hono } from "hono";
import OpenAI from "openai";
import { insertReport } from "../db";

export const transcribeRoute = new Hono();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — Whisper's limit

transcribeRoute.post("/transcribe", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("audio") as File | null;
  const workerName = (formData.get("workerName") as string) || "Anonymous";

  if (!file) {
    return c.json({ error: "No audio file provided" }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      { error: "File too large. Maximum size is 25MB." },
      400,
    );
  }

  // 1. Transcribe with Whisper
  let rawText: string;
  try {
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });
    rawText = transcription.text;
  } catch (err) {
    const message =
      err instanceof OpenAI.APIError
        ? `Transcription failed: ${err.message}`
        : "Transcription failed. Please try again.";
    return c.json({ error: message }, 500);
  }

  // 2. Structure with GPT-4o
  const fallbackReport = {
    tasksCompleted: [] as string[],
    tasksInProgress: [] as string[],
    blockers: [] as string[],
    summary: rawText,
  };

  let report = fallbackReport;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a workplace reporting assistant. Convert the raw voice transcript into a structured work status report.
Return a JSON object with exactly these fields:
- tasksCompleted: string[] (tasks the worker finished)
- tasksInProgress: string[] (tasks still being worked on)
- blockers: string[] (issues, problems, or things waiting on others)
- summary: string (one sentence overview)

Only include items actually mentioned. Use empty arrays if nothing applies. Return only valid JSON.`,
        },
        {
          role: "user",
          content: rawText,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    try {
      report = { ...fallbackReport, ...JSON.parse(content) };
    } catch {
      // GPT returned unparseable JSON — use fallback with raw transcript as summary
    }
  } catch (err) {
    // Structuring failed but we still have the transcript — continue with fallback
    console.error("GPT-4o structuring failed:", err);
  }

  const reportId = insertReport(
    workerName,
    report.tasksCompleted,
    report.tasksInProgress,
    report.blockers,
    report.summary,
    rawText,
  );

  return c.json({ id: reportId, transcript: rawText, report });
});
