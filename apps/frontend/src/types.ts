export interface Report {
  tasksCompleted: string[];
  tasksInProgress: string[];
  blockers: string[];
  summary: string;
}

export interface ReportRecord extends Report {
  id: number;
  workerName: string;
  timestamp: string;
  transcript: string;
}
