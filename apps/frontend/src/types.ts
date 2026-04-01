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
  submitted?: boolean;
}

export interface AuthUser {
  userId: number;
  name: string;
  role: "worker" | "manager";
}

export type AuthState =
  | { status: "loading" }
  | ({ status: "authenticated" } & AuthUser)
  | { status: "unauthenticated" };
