import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { ReportRecord } from "../types";
import Navbar from "../components/Navbar";

export default function MyReportsPage() {
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

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d]">
      <Navbar showSignOut />
      <div className="max-w-2xl mx-auto px-4 pb-6">

        <h1 className="text-2xl font-extrabold text-[#1e293b] dark:text-white mb-6">My Reports</h1>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#4f46e5] dark:border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#94a3b8] dark:text-[#6b7280] mb-4">No reports yet — record your first update</p>
            <Link
              to="/"
              className="bg-[#4f46e5] dark:bg-gradient-to-r dark:from-[#8b5cf6] dark:to-[#3b82f6] text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Record now
            </Link>
          </div>
        )}

        {/* Report cards */}
        {!loading && reports.length > 0 && (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate("/report", { state: { id: r.id, report: r, transcript: r.transcript } })}
                className={`bg-white dark:bg-[#161616] border-l-[3px] rounded-r-xl cursor-pointer hover:opacity-90 transition-opacity shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-none ${
                  r.blockers.length > 0
                    ? "border-l-[#f87171] border border-[#fecaca] dark:border-[#ef4444]/25"
                    : "border-l-[#4ade80] border border-[#bbf7d0] dark:border-[#16a34a]/20"
                } p-4`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[#1e293b] dark:text-[#e2e8f0] text-sm font-semibold line-clamp-2 flex-1 mr-3">{r.summary}</p>
                  {r.blockers.length > 0 ? (
                    <span className="flex-shrink-0 bg-[#fef2f2] dark:bg-[#200a0a] border border-[#fecaca] dark:border-[#ef4444]/40 text-[#dc2626] dark:text-[#f87171] text-[10px] font-bold px-2 py-0.5 rounded-full">🚫 BLOCKED</span>
                  ) : (
                    <span className="flex-shrink-0 bg-[#f0fdf4] dark:bg-[#052e16] border border-[#bbf7d0] dark:border-[#16a34a]/40 text-[#15803d] dark:text-[#4ade80] text-[10px] font-bold px-2 py-0.5 rounded-full">✓ CLEAR</span>
                  )}
                </div>
                <p className="text-[#94a3b8] dark:text-[#6b7280] text-xs mb-3">
                  {new Date(r.timestamp).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <span className="bg-[#f0fdf4] dark:bg-[#16a34a]/20 text-[#15803d] dark:text-[#4ade80] text-xs px-2 py-0.5 rounded">✓ {r.tasksCompleted.length}</span>
                  <span className="bg-[#eff6ff] dark:bg-[#3b82f6]/20 text-[#1d4ed8] dark:text-[#60a5fa] text-xs px-2 py-0.5 rounded">⚡ {r.tasksInProgress.length}</span>
                  <span className="bg-[#fef2f2] dark:bg-[#ef4444]/20 text-[#dc2626] dark:text-[#f87171] text-xs px-2 py-0.5 rounded">🚫 {r.blockers.length}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
