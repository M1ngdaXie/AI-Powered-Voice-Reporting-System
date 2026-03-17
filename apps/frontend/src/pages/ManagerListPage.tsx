import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ReportRecord } from "../types";

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
          <p className="text-gray-500 text-sm">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500 text-sm">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => navigate(`/manager/${report.id}`)}
                className="w-full text-left bg-gray-900 rounded-xl p-5 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{report.workerName}</span>
                  {report.blockers.length > 0 ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                      BLOCKED
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-950 text-green-400 border border-green-800">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mb-2">
                  {new Date(report.timestamp + "Z").toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {report.tasksCompleted[0] ?? "No tasks listed"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
