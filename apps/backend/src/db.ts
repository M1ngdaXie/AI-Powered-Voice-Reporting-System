import postgres from "postgres";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const sql = postgres(DATABASE_URL, { ssl: "require" });

// Run schema on startup
const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
await sql.unsafe(schema);

// --- Types ---

export interface ReportRow {
  id: number;
  workerName: string;
  userId: number;
  timestamp: string;
  tasksCompleted: string[];
  tasksInProgress: string[];
  blockers: string[];
  summary: string;
  transcript: string;
  submitted: boolean;
  audioKey: string | null;
  jobId: string | null;
  processingStatus: string;
}

function parseRow(row: Record<string, unknown>): ReportRow {
  return {
    id: row.id as number,
    workerName: row.worker_name as string,
    userId: row.user_id as number,
    timestamp: (row.timestamp as Date).toISOString(),
    tasksCompleted: (row.tasks_completed as string[]) ?? [],
    tasksInProgress: (row.tasks_in_progress as string[]) ?? [],
    blockers: (row.blockers as string[]) ?? [],
    summary: row.summary as string,
    transcript: row.transcript as string,
    submitted: row.submitted as boolean,
    audioKey: (row.audio_key as string | null) ?? null,
    jobId: (row.job_id as string | null) ?? null,
    processingStatus: (row.processing_status as string) ?? "done",
  };
}

// --- Reports ---

export async function insertReport(
  workerName: string,
  userId: number,
  tasksCompleted: string[],
  tasksInProgress: string[],
  blockers: string[],
  summary: string,
  transcript: string,
  audioKey: string | null = null,
  processingStatus: string = "done",
): Promise<number> {
  const rows = await sql`
    INSERT INTO reports
      (worker_name, user_id, tasks_completed, tasks_in_progress, blockers, summary, transcript, audio_key, processing_status)
    VALUES
      (${workerName}, ${userId}, ${sql.json(tasksCompleted)}, ${sql.json(tasksInProgress)}, ${sql.json(blockers)}, ${summary}, ${transcript}, ${audioKey}, ${processingStatus})
    RETURNING id
  `;
  const row = rows[0];
  if (!row) throw new Error("INSERT reports returned no row");
  return row.id as number;
}

export async function getReportById(id: number): Promise<ReportRow | null> {
  const rows = await sql`SELECT * FROM reports WHERE id = ${id}`;
  return rows[0] ? parseRow(rows[0] as Record<string, unknown>) : null;
}

export async function getAllReports(): Promise<ReportRow[]> {
  const rows = await sql`SELECT * FROM reports WHERE submitted = true ORDER BY id DESC`;
  return rows.map((r) => parseRow(r as Record<string, unknown>));
}

export async function getReportsByUserId(userId: number): Promise<ReportRow[]> {
  const rows = await sql`SELECT * FROM reports WHERE user_id = ${userId} ORDER BY id DESC`;
  return rows.map((r) => parseRow(r as Record<string, unknown>));
}

export async function updateReport(
  id: number,
  tasksCompleted: string[],
  tasksInProgress: string[],
  blockers: string[],
  summary: string,
): Promise<ReportRow | null> {
  await sql`
    UPDATE reports
    SET tasks_completed = ${sql.json(tasksCompleted)},
        tasks_in_progress = ${sql.json(tasksInProgress)},
        blockers = ${sql.json(blockers)},
        summary = ${summary}
    WHERE id = ${id}
  `;
  return getReportById(id);
}

export async function submitReport(id: number): Promise<ReportRow | null> {
  await sql`UPDATE reports SET submitted = true WHERE id = ${id}`;
  return getReportById(id);
}

export async function updateReportAfterProcessing(
  id: number,
  tasksCompleted: string[],
  tasksInProgress: string[],
  blockers: string[],
  summary: string,
  transcript: string,
): Promise<void> {
  await sql`
    UPDATE reports
    SET tasks_completed = ${sql.json(tasksCompleted)},
        tasks_in_progress = ${sql.json(tasksInProgress)},
        blockers = ${sql.json(blockers)},
        summary = ${summary},
        transcript = ${transcript},
        processing_status = 'done'
    WHERE id = ${id}
  `;
}

export async function setReportJobId(reportId: number, jobId: string): Promise<void> {
  await sql`UPDATE reports SET job_id = ${jobId} WHERE id = ${reportId}`;
}

export async function setReportFailed(reportId: number): Promise<void> {
  await sql`UPDATE reports SET processing_status = 'failed' WHERE id = ${reportId}`;
}

// --- Feedback ---

export async function insertFeedback(
  reportId: number,
  accurate: string,
  easier: string,
  comment: string,
): Promise<number> {
  const rows = await sql`
    INSERT INTO feedback (report_id, accurate, easier, comment)
    VALUES (${reportId}, ${accurate}, ${easier}, ${comment})
    RETURNING id
  `;
  const row = rows[0];
  if (!row) throw new Error("INSERT feedback returned no row");
  return row.id as number;
}

export async function getAllFeedback() {
  const rows = await sql`
    SELECT f.*, r.worker_name
    FROM feedback f
    LEFT JOIN reports r ON f.report_id = r.id
    ORDER BY f.id DESC
  `;
  return rows.map((row) => ({
    id: row.id,
    reportId: row.report_id,
    workerName: row.worker_name ?? "Unknown",
    accurate: row.accurate,
    easier: row.easier,
    comment: row.comment,
    timestamp: (row.timestamp as Date).toISOString(),
  }));
}

export async function getFeedbackSummary() {
  const totalRows = await sql`SELECT COUNT(*) as c FROM feedback`;
  const total = Number((totalRows[0] as { c: string } | undefined)?.c ?? 0);
  const accurateCounts = await sql`SELECT accurate, COUNT(*) as c FROM feedback GROUP BY accurate` as { accurate: string; c: string }[];
  const easierCounts = await sql`SELECT easier, COUNT(*) as c FROM feedback GROUP BY easier` as { easier: string; c: string }[];
  return {
    total,
    accurate: Object.fromEntries(accurateCounts.map((r) => [r.accurate, Number(r.c)])),
    easier: Object.fromEntries(easierCounts.map((r) => [r.easier, Number(r.c)])),
  };
}

export async function hasFeedbackForReport(reportId: number): Promise<boolean> {
  const rows = await sql`SELECT COUNT(*) as c FROM feedback WHERE report_id = ${reportId}`;
  return Number((rows[0] as { c: string } | undefined)?.c ?? 0) > 0;
}

// --- Users ---

export async function getUserByEmail(email: string) {
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  return (rows[0] as { id: number; email: string; name: string; password_hash: string; role: string } | undefined) ?? null;
}

export async function getUserById(id: number) {
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return (rows[0] as { id: number; email: string; name: string; password_hash: string; role: string } | undefined) ?? null;
}

export async function insertUser(
  email: string,
  name: string,
  passwordHash: string,
  role: string,
): Promise<number> {
  const rows = await sql`
    INSERT INTO users (email, name, password_hash, role)
    VALUES (${email}, ${name}, ${passwordHash}, ${role})
    RETURNING id
  `;
  const row = rows[0];
  if (!row) throw new Error("INSERT users returned no row");
  return row.id as number;
}

export async function getAllUsers() {
  const rows = await sql`SELECT id as "userId", email, name, role, created_at FROM users ORDER BY id ASC`;
  return rows.map((r) => ({
    userId: r.userId as number,
    email: r.email as string,
    name: r.name as string,
    role: r.role as string,
    created_at: (r.created_at as Date).toISOString(),
  }));
}

export async function updateUserRole(id: number, role: string): Promise<void> {
  await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
}

export async function countManagersExcept(userId: number): Promise<number> {
  const rows = await sql`SELECT COUNT(*) as c FROM users WHERE role = 'manager' AND id != ${userId}`;
  return Number((rows[0] as { c: string } | undefined)?.c ?? 0);
}
