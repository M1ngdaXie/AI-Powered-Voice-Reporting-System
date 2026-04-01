import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReportRecord } from "../types";

export default function MyReportsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/mine", { credentials: "include" })
      .then((r) => r.json())
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const workerName = auth.status === "authenticated" ? auth.name : "";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">My Reports</h1>
              {workerName && <p className="text-xs text-gray-500">{workerName}</p>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No reports yet</p>
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block transition-colors">
              Record your first report →
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => navigate("/report", { state: { id: report.id, report, transcript: report.transcript } })}
              className="w-full text-left bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-4 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{report.summary}</p>
                {report.blockers.length > 0 && (
                  <span className="shrink-0 text-xs bg-red-900/50 text-red-400 border border-red-800/50 px-2 py-0.5 rounded-full">
                    Blocked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>{new Date(report.timestamp + "Z").toLocaleString()}</span>
                <span className="text-green-700">{report.tasksCompleted.length} done</span>
                <span className="text-blue-700">{report.tasksInProgress.length} in progress</span>
                {report.blockers.length > 0 && (
                  <span className="text-red-700">{report.blockers.length} blocker{report.blockers.length !== 1 ? "s" : ""}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
