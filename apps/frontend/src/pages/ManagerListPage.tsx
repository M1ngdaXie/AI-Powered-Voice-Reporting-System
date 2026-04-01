import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReportRecord } from "../types";
import { useAuth } from "../context/AuthContext";
import { avatarColor, initials } from "../utils/avatar";
import Navbar from "../components/Navbar";

export default function ManagerListPage() {
  const { logout } = useAuth();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/reports", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d]">
      <Navbar
        links={[{ href: "/feedback", label: "Feedback" }, { href: "/admin/users", label: "Users" }]}
        showSignOut
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-extrabold text-[#1e293b] dark:text-white mb-6">Team Reports</h1>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Reports", value: reports.length, colorClass: "text-[#1e293b] dark:text-white" },
            { label: "Active", value: reports.filter(r => r.tasksInProgress.length > 0).length, colorClass: "text-[#1d4ed8] dark:text-[#60a5fa]" },
            { label: "Blocked", value: reports.filter(r => r.blockers.length > 0).length, colorClass: "text-[#dc2626] dark:text-[#f87171]" },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-xl p-4 text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-none">
              <p className={`text-3xl font-extrabold ${stat.colorClass}`}>{stat.value}</p>
              <p className="text-[#94a3b8] dark:text-[#6b7280] text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#4f46e5] dark:border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-center text-[#94a3b8] dark:text-[#6b7280] py-16">No reports yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/manager/${r.id}`)}
                className={`bg-white dark:bg-[#161616] border-l-[3px] rounded-r-xl cursor-pointer hover:opacity-90 transition-opacity shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-none ${
                  r.blockers.length > 0
                    ? "border-l-[#f87171] border border-[#fecaca] dark:border-[#ef4444]/25"
                    : "border-l-[#4ade80] border border-[#bbf7d0] dark:border-[#16a34a]/20"
                } p-4`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: avatarColor(r.workerName) }}
                  >
                    {initials(r.workerName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[#1e293b] dark:text-[#e2e8f0] text-sm font-semibold">{r.workerName}</span>
                      {r.blockers.length > 0 ? (
                        <span className="flex-shrink-0 bg-[#fef2f2] dark:bg-[#200a0a] border border-[#fecaca] dark:border-[#ef4444]/40 text-[#dc2626] dark:text-[#f87171] text-[10px] font-bold px-2 py-0.5 rounded-full">🚫 BLOCKED</span>
                      ) : (
                        <span className="flex-shrink-0 bg-[#f0fdf4] dark:bg-[#052e16] border border-[#bbf7d0] dark:border-[#16a34a]/40 text-[#15803d] dark:text-[#4ade80] text-[10px] font-bold px-2 py-0.5 rounded-full">✓ CLEAR</span>
                      )}
                    </div>
                    <p className="text-[#94a3b8] dark:text-[#6b7280] text-xs">{new Date(r.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-[#64748b] dark:text-[#9ca3af] text-sm line-clamp-2 mb-3 ml-12">{r.summary}</p>
                <div className="flex gap-2 ml-12">
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
