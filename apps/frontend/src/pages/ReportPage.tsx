import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Section from "../components/Section";
import EditableSection from "../components/EditableSection";
import FeedbackForm from "../components/FeedbackForm";
import Navbar from "../components/Navbar";
import type { Report, ReportRecord } from "../types";

interface LocationState {
  id: number;
  transcript: string;
  report: ReportRecord;
  justGenerated?: boolean;
}

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [report, setReport] = useState<ReportRecord | null>(state?.report ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Report | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(state?.justGenerated ?? false);
  const [submitted, setSubmitted] = useState(state?.report?.submitted ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [undoBanner, setUndoBanner] = useState<{ previous: ReportRecord; countdown: number } | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-dismiss success banner
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [showSuccess]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!editing) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editing]);

  // Clean up undo timer
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    };
  }, []);

  if (!state || !report) {
    navigate("/");
    return null;
  }

  const { id, transcript } = state;

  function startEdit() {
    if (!report) return;
    setDraft({
      summary: report.summary,
      tasksCompleted: [...report.tasksCompleted],
      tasksInProgress: [...report.tasksInProgress],
      blockers: [...report.blockers],
    });
    setEditing(true);
  }

  function cancelEdit() {
    if (!window.confirm("Discard unsaved changes?")) return;
    setEditing(false);
    setDraft(null);
  }

  async function saveEdit() {
    if (!draft || !report) return;
    if (!window.confirm("Save changes to this report?")) return;

    setSaving(true);
    const previousReport = { ...report };
    try {
      const cleaned = {
        summary: draft.summary,
        tasksCompleted: draft.tasksCompleted.filter((s) => s.trim()),
        tasksInProgress: draft.tasksInProgress.filter((s) => s.trim()),
        blockers: draft.blockers.filter((s) => s.trim()),
      };
      const res = await fetch(`/api/reports/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) throw new Error();
      setReport({ ...report, ...cleaned });
      setEditing(false);
      setDraft(null);

      // Start undo countdown
      let countdown = 5;
      setUndoBanner({ previous: previousReport, countdown });
      undoTimerRef.current = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          if (undoTimerRef.current) clearInterval(undoTimerRef.current);
          setUndoBanner(null);
        } else {
          setUndoBanner((prev) => prev ? { ...prev, countdown } : null);
        }
      }, 1000);
    } finally {
      setSaving(false);
    }
  }

  async function handleUndo() {
    if (!undoBanner) return;
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    const prev = undoBanner.previous;
    setUndoBanner(null);

    await fetch(`/api/reports/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prev),
    });
    setReport(prev);
  }

  function handleNewReport() {
    if (editing && !window.confirm("You have unsaved edits. Leave anyway?")) return;
    navigate("/");
  }

  async function handleSubmitReport() {
    if (!window.confirm("Submit this report to your manager?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${id}/submit`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d] text-[#1e293b] dark:text-white">
      <Navbar backTo={{ href: "/my-reports", label: "My Reports" }} />
      <div className="max-w-2xl mx-auto px-4 pb-6">

        {/* Success banner */}
        {showSuccess && (
          <div className={`bg-[#f0fdf4] dark:bg-[#0a1a0a] border border-[#bbf7d0] dark:border-[#16a34a]/40 rounded-xl px-4 py-3 flex items-center gap-2 mb-4 transition-opacity duration-500 ${showSuccess ? "opacity-100" : "opacity-0"}`}>
            <svg className="w-5 h-5 text-[#15803d] dark:text-[#4ade80] shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="text-[#15803d] dark:text-[#4ade80] text-sm font-medium">Report generated successfully!</p>
          </div>
        )}

        {/* Report header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e293b] dark:text-white">
              {new Date(report.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </h1>
            <p className="text-[#64748b] dark:text-[#9ca3af] text-sm mt-1">
              {report.workerName} · {new Date(report.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* BLOCKED or CLEAR badge */}
            {report.blockers.length > 0 ? (
              <span className="bg-[#fef2f2] dark:bg-[#160808] border border-[#fecaca] dark:border-[#ef4444]/40 text-[#dc2626] dark:text-[#f87171] text-xs font-bold px-3 py-1 rounded-full">
                🚫 BLOCKED
              </span>
            ) : (
              <span className="bg-[#f0fdf4] dark:bg-[#0a1a0a] border border-[#bbf7d0] dark:border-[#16a34a]/40 text-[#15803d] dark:text-[#4ade80] text-xs font-bold px-3 py-1 rounded-full">
                ✓ CLEAR
              </span>
            )}
            {/* Submit button or Submitted badge — shown when NOT in edit mode */}
            {!editing && (
              submitted ? (
                <span className="bg-[#f0fdf4] dark:bg-[#0a1a0a] border border-[#bbf7d0] dark:border-[#16a34a]/40 text-[#15803d] dark:text-[#4ade80] text-xs font-bold px-3 py-1.5 rounded-full">
                  ✓ Submitted
                </span>
              ) : (
                <button
                  onClick={handleSubmitReport}
                  disabled={submitting}
                  className="bg-[#15803d] dark:bg-[#16a34a] text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              )
            )}
            {/* Edit button — shown when NOT in edit mode */}
            {!editing && (
              <button
                onClick={startEdit}
                className="bg-[#4f46e5] dark:bg-gradient-to-r dark:from-[#8b5cf6] dark:to-[#3b82f6] text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                ✏️ Edit Report
              </button>
            )}
            {/* Save/Cancel when in edit mode */}
            {editing && (
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="bg-[#4f46e5] dark:bg-gradient-to-r dark:from-[#8b5cf6] dark:to-[#3b82f6] text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="bg-[#f1f5f9] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333] text-[#64748b] dark:text-[#9ca3af] text-sm font-medium px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary card */}
        <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#8b5cf6]/25 rounded-xl overflow-hidden mb-4 shadow-[0_2px_8px_rgba(79,70,229,0.08)] dark:shadow-none">
          <div className="h-[2px] bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6]" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#4f46e5] dark:text-[#a78bfa] text-xs font-bold uppercase tracking-widest">✨ AI Summary</span>
            </div>
            {editing && draft ? (
              <textarea
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                rows={3}
                className="w-full bg-[#f8fafc] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333] rounded-lg px-3 py-2 text-sm text-[#1e293b] dark:text-white focus:border-[#4f46e5] dark:focus:border-[#8b5cf6] focus:outline-none transition-colors resize-none"
              />
            ) : (
              <p className="text-[#334155] dark:text-[#e2e8f0] text-sm leading-relaxed">{report.summary}</p>
            )}
          </div>
        </div>

        {/* Section cards */}
        {editing && draft ? (
          <>
            <EditableSection
              title="Tasks Completed"
              color="green"
              items={draft.tasksCompleted}
              onChange={(items) => setDraft({ ...draft, tasksCompleted: items })}
            />
            <EditableSection
              title="In Progress"
              color="blue"
              items={draft.tasksInProgress}
              onChange={(items) => setDraft({ ...draft, tasksInProgress: items })}
            />
            <EditableSection
              title="Blockers"
              color="red"
              items={draft.blockers}
              onChange={(items) => setDraft({ ...draft, blockers: items })}
            />
          </>
        ) : (
          <>
            <Section title="Tasks Completed" color="green" items={report.tasksCompleted} emptyMessage="No completed tasks mentioned." />
            <Section title="In Progress" color="blue" items={report.tasksInProgress} emptyMessage="No in-progress tasks mentioned." />
            <Section title="Blockers" color="red" items={report.blockers} emptyMessage="No blockers mentioned." />
          </>
        )}

        {/* Collapsible transcript */}
        <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-xl overflow-hidden mb-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📄</span>
              <span className="text-[#64748b] dark:text-[#9ca3af] text-sm font-medium">Raw Transcript</span>
            </div>
            <span className="text-[#94a3b8] dark:text-[#6b7280] text-sm">{showTranscript ? "Hide ▲" : "Show ▼"}</span>
          </button>
          {showTranscript && (
            <div className="px-4 pb-4 border-t border-[#e2e8f0] dark:border-[#2a2a2a]">
              <p className="text-[#64748b] dark:text-[#9ca3af] text-sm leading-relaxed mt-3 whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>

        {/* Feedback form */}
        {!editing && <FeedbackForm reportId={id} />}
      </div>

      {/* Undo banner */}
      {undoBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1e293b] dark:bg-[#e2e8f0] text-white dark:text-[#1e293b] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm">
          <span>Changes saved</span>
          <button onClick={handleUndo} className="font-bold underline">Undo ({undoBanner.countdown}s)</button>
        </div>
      )}
    </div>
  );
}
