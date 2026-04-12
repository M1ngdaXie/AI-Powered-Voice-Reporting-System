import { Queue } from "bullmq";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error("REDIS_URL is required");

export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});

export const transcriptionQueue = new Queue("transcription", { connection });

export interface TranscriptionJobData {
  reportId: number;
  audioKey: string;
  workerName: string;
  userId: number;
}
