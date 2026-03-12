import { Hono } from "hono";
import OpenAI from "openai";

export const transcribeRoute = new Hono();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

transcribeRoute.post("/transcribe", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("audio") as File | null;

  if (!file) {
    return c.json({ error: "No audio file provided" }, 400);
  }

  // 1. Transcribe with Whisper
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  const rawText = transcription.text;

  // 2. Structure with GPT-4o
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
  const report = JSON.parse(content);

  return c.json({ transcript: rawText, report });
});
