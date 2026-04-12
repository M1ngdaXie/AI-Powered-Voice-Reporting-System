import { Worker, Job } from "bullmq";
import OpenAI, { toFile } from "openai";
import { connection } from "./queue";
import type { TranscriptionJobData } from "./queue";
import { downloadAudio } from "./r2";
import { updateReportAfterProcessing, setReportFailed } from "./db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function structureReport(rawText: string) {
  const fallback = {
    tasksCompleted: [] as string[],
    tasksInProgress: [] as string[],
    blockers: [] as string[],
    summary: rawText,
  };

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
        { role: "user", content: rawText },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    return { ...fallback, ...JSON.parse(content) };
  } catch {
    return fallback;
  }
}

const worker = new Worker<TranscriptionJobData>(
  "transcription",
  async (job: Job<TranscriptionJobData>) => {
    const { reportId, audioKey } = job.data;

    // 1. Download audio from R2
    const audioBytes = await downloadAudio(audioKey);
    // Preserve the original filename so Whisper can infer the format from the extension.
    // Use toFile() from the OpenAI SDK for cross-environment compatibility with Bun.
    const originalFilename = audioKey.split("/").pop() ?? "audio.webm";
    const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "webm";
    const mimeMap: Record<string, string> = {
      webm: "audio/webm",
      mp4: "audio/mp4",
      m4a: "audio/mp4",
      mp3: "audio/mpeg",
      mpeg: "audio/mpeg",
      mpga: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      oga: "audio/ogg",
      flac: "audio/flac",
    };
    const mimeType = mimeMap[ext] ?? "audio/webm";
    const audioFile = await toFile(audioBytes, originalFilename, { type: mimeType });

    // 2. Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    // 3. Structure with GPT-4o
    const report = await structureReport(transcription.text);

    // 4. Persist results to DB
    await updateReportAfterProcessing(
      reportId,
      report.tasksCompleted,
      report.tasksInProgress,
      report.blockers,
      report.summary,
      transcription.text,
    );
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60_000 }, // max 10 OpenAI calls per minute
  },
);

worker.on("failed", async (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
  if (job?.data.reportId) {
    await setReportFailed(job.data.reportId).catch(() => {});
  }
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed for report ${job.data.reportId}`);
});

console.log("Transcription worker started");
