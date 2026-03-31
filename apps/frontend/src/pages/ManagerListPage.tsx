import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ReportRecord } from "../types";

const AVATAR_COLORS = [
  "bg-indigo-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600",
  "bg-cyan-600", "bg-purple-600", "bg-pink-600", "bg-teal-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ManagerListPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/feedback"
              className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              Feedback
            </Link>
            <Link
              to="/"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Worker View
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading reports...</p>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No reports yet.</p>
            <p className="text-gray-600 text-sm">Workers can submit reports from the home page.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const hasBlockers = report.blockers.length > 0;
              return (
                <button
                  key={report.id}
                  onClick={() => navigate(`/manager/${report.id}`)}
                  className={`w-full text-left bg-gray-900 rounded-xl p-5 hover:bg-gray-800 transition-colors border-l-4 overflow-hidden ${
                    hasBlockers ? "border-l-red-500" : "border-l-green-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${getAvatarColor(report.workerName)}`}>
                        {report.workerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold">{report.workerName}</span>
                    </div>
                    {hasBlockers ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 shrink-0">
                        BLOCKED
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-950 text-green-400 border border-green-800 shrink-0">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="text-gray-500 text-xs mb-2">
                    {new Date(report.timestamp + "Z").toLocaleString()}
                  </p>

                  {/* Summary */}
                  <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                    {report.summary}
                  </p>

                  {/* Task counts */}
                  <div className="flex gap-3 text-xs text-gray-500">
                    {report.tasksCompleted.length > 0 && (
                      <span>{report.tasksCompleted.length} completed</span>
                    )}
                    {report.tasksInProgress.length > 0 && (
                      <span>{report.tasksInProgress.length} in progress</span>
                    )}
                    {report.blockers.length > 0 && (
                      <span className="text-red-400">{report.blockers.length} blocker{report.blockers.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
