import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Section from "../components/Section";
import Navbar from "../components/Navbar";
import { avatarColor, initials } from "../utils/avatar";
import type { ReportRecord } from "../types";
import { Ban, Check, FileText } from "lucide-react";

export default function ManagerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setReport(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4f46e5] dark:border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d] flex flex-col items-center justify-center gap-4">
        <p className="text-[#64748b] dark:text-[#9ca3af]">Report not found.</p>
        <button
          onClick={() => navigate("/manager")}
          className="text-[#4f46e5] dark:text-[#8b5cf6] hover:opacity-80 text-sm transition-opacity"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const hasBlockers = report.blockers.length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d]">
      <Navbar backTo={{ href: "/manager", label: "Dashboard" }} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Worker header card */}
        <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-6 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full text-white font-bold text-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: avatarColor(report.workerName) }}
          >
            {initials(report.workerName)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[#1e293b] dark:text-[#e2e8f0] text-xl font-bold truncate">
              {report.workerName}
            </h2>
            <p className="text-[#64748b] dark:text-[#9ca3af] text-sm">
              {new Date(report.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {new Date(report.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex-shrink-0">
            {hasBlockers ? (
              <span className="inline-flex items-center gap-1 bg-[#fef2f2] dark:bg-[#160808] border border-[#fecaca] dark:border-[#ef444440] text-[#dc2626] dark:text-[#f87171] text-xs font-semibold px-2.5 py-1 rounded-full">
                <Ban size={11} /> BLOCKED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-[#f0fdf4] dark:bg-[#0a1a0a] border border-[#bbf7d0] dark:border-[#16a34a40] text-[#15803d] dark:text-[#4ade80] text-xs font-semibold px-2.5 py-1 rounded-full">
                <Check size={11} /> CLEAR
              </span>
            )}
          </div>
        </div>

        {/* AI Summary card */}
        <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#8b5cf640] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6]" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-[#ede9fe] dark:bg-[#8b5cf620] border border-[#ddd6fe] dark:border-[#8b5cf640] text-xs flex items-center justify-center">
              ✦
            </div>
            <span className="text-[#7c3aed] dark:text-[#a78bfa] text-xs uppercase tracking-widest font-bold">
              AI Summary
            </span>
          </div>
          <p className="text-[#1e293b] dark:text-[#e2e8f0] text-sm leading-relaxed mt-2">
            {report.summary}
          </p>
        </div>

        {/* Section cards */}
        <Section
          title="Tasks Completed"
          color="green"
          items={report.tasksCompleted}
          emptyMessage="No completed tasks mentioned."
        />
        <Section
          title="In Progress"
          color="blue"
          items={report.tasksInProgress}
          emptyMessage="No in-progress tasks mentioned."
        />
        <Section
          title="Blockers"
          color="red"
          items={report.blockers}
          emptyMessage="No blockers mentioned."
        />

        {/* Collapsible transcript */}
        <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f8fafc] dark:hover:bg-[#1f1f1f] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#64748b] dark:text-[#9ca3af]" />
              <span className="text-[#64748b] dark:text-[#9ca3af] text-sm font-medium">Raw Transcript</span>
            </div>
            <span className="text-[#94a3b8] dark:text-[#6b7280] text-xs">
              {showTranscript ? "Hide ▲" : "Show ▼"}
            </span>
          </button>
          {showTranscript && (
            <div className="px-4 pb-4 border-t border-[#e2e8f0] dark:border-[#2a2a2a]">
              <p className="text-[#64748b] dark:text-[#9ca3af] text-sm leading-relaxed pt-3">
                {report.transcript}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
