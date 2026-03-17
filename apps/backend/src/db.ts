import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(import.meta.dir, "../data");
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, "reports.db"));

db.run(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_name TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    tasks_completed TEXT NOT NULL,
    tasks_in_progress TEXT NOT NULL,
    blockers TEXT NOT NULL,
    summary TEXT NOT NULL,
    transcript TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    accurate TEXT NOT NULL,
    easier TEXT NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES reports(id)
  )
`);

const insertStmt = db.prepare(`
  INSERT INTO reports (worker_name, tasks_completed, tasks_in_progress, blockers, summary, transcript)
  VALUES (?, ?, ?, ?, ?, ?)
`);

export function insertReport(
  workerName: string,
  tasksCompleted: string[],
  tasksInProgress: string[],
  blockers: string[],
  summary: string,
  transcript: string,
): number {
  insertStmt.run(
    workerName,
    JSON.stringify(tasksCompleted),
    JSON.stringify(tasksInProgress),
    JSON.stringify(blockers),
    summary,
    transcript,
  );
  const row = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
  return row.id;
}

function parseRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    workerName: row.worker_name,
    timestamp: row.timestamp,
    tasksCompleted: JSON.parse(row.tasks_completed as string),
    tasksInProgress: JSON.parse(row.tasks_in_progress as string),
    blockers: JSON.parse(row.blockers as string),
    summary: row.summary,
    transcript: row.transcript,
  };
}

export function getAllReports() {
  const rows = db.query("SELECT * FROM reports ORDER BY id DESC").all();
  return rows.map((row) => parseRow(row as Record<string, unknown>));
}

const updateStmt = db.prepare(`
  UPDATE reports SET tasks_completed = ?, tasks_in_progress = ?, blockers = ?, summary = ?
  WHERE id = ?
`);

export function updateReport(
  id: number,
  tasksCompleted: string[],
  tasksInProgress: string[],
  blockers: string[],
  summary: string,
) {
  updateStmt.run(
    JSON.stringify(tasksCompleted),
    JSON.stringify(tasksInProgress),
    JSON.stringify(blockers),
    summary,
    id,
  );
  return getReportById(id);
}

export function getReportById(id: number) {
  const row = db.query("SELECT * FROM reports WHERE id = ?").get(id);
  return row ? parseRow(row as Record<string, unknown>) : null;
}

// --- Feedback ---

const insertFeedbackStmt = db.prepare(`
  INSERT INTO feedback (report_id, accurate, easier, comment)
  VALUES (?, ?, ?, ?)
`);

export function insertFeedback(
  reportId: number,
  accurate: string,
  easier: string,
  comment: string,
): number {
  insertFeedbackStmt.run(reportId, accurate, easier, comment);
  const row = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
  return row.id;
}

export function getAllFeedback() {
  const rows = db.query(`
    SELECT f.*, r.worker_name
    FROM feedback f
    LEFT JOIN reports r ON f.report_id = r.id
    ORDER BY f.id DESC
  `).all() as Record<string, unknown>[];
  return rows.map((row) => ({
    id: row.id,
    reportId: row.report_id,
    workerName: row.worker_name ?? "Unknown",
    accurate: row.accurate,
    easier: row.easier,
    comment: row.comment,
    timestamp: row.timestamp,
  }));
}

export function getFeedbackSummary() {
  const total = (db.query("SELECT COUNT(*) as c FROM feedback").get() as { c: number }).c;
  const accurateCounts = db.query("SELECT accurate, COUNT(*) as c FROM feedback GROUP BY accurate").all() as { accurate: string; c: number }[];
  const easierCounts = db.query("SELECT easier, COUNT(*) as c FROM feedback GROUP BY easier").all() as { easier: string; c: number }[];
  return {
    total,
    accurate: Object.fromEntries(accurateCounts.map((r) => [r.accurate, r.c])),
    easier: Object.fromEntries(easierCounts.map((r) => [r.easier, r.c])),
  };
}

export function hasFeedbackForReport(reportId: number): boolean {
  const row = db.query("SELECT COUNT(*) as c FROM feedback WHERE report_id = ?").get(reportId) as { c: number };
  return row.c > 0;
}
