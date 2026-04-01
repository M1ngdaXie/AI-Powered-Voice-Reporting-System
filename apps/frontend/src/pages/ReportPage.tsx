import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Section from "../components/Section";
import EditableSection from "../components/EditableSection";
import FeedbackForm from "../components/FeedbackForm";
import type { Report } from "../types";

interface LocationState {
  id: number;
  transcript: string;
  report: Report;
  justGenerated?: boolean;
}

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [report, setReport] = useState<Report | null>(state?.report ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Report | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(state?.justGenerated ?? false);
  const [undoBanner, setUndoBanner] = useState<{ previous: Report; countdown: number } | null>(null);
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
      setReport(cleaned);
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success banner */}
        {showSuccess && (
          <div className={`bg-green-950 border border-green-800 rounded-xl px-4 py-3 flex items-center gap-2 transition-opacity duration-500 ${showSuccess ? "opacity-100" : "opacity-0"}`}>
            <svg className="w-5 h-5 text-green-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="text-green-400 text-sm font-medium">Report generated successfully!</p>
          </div>
        )}

        {/* Undo banner */}
        {undoBanner && (
          <div className="bg-indigo-950 border border-indigo-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-indigo-300 text-sm">Changes saved! Undo within {undoBanner.countdown}s</p>
            <button
              onClick={handleUndo}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
            >
              Undo
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Work Status Report</h1>
          <div className="flex items-center gap-3">
            {!editing && (
              <button
                onClick={startEdit}
                className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleNewReport}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← New Report
            </button>
          </div>
        </div>

        {editing && draft ? (
          <>
            <textarea
              value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 text-sm focus:border-indigo-500 focus:outline-none transition-colors resize-none"
            />

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

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors text-sm"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="text-gray-400 hover:text-white py-2 px-6 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm">{report.summary}</p>

            <Section title="Tasks Completed" color="green" items={report.tasksCompleted} empty="No completed tasks mentioned." />
            <Section title="In Progress" color="blue" items={report.tasksInProgress} empty="No in-progress tasks mentioned." />
            <Section title="Blockers" color="red" items={report.blockers} empty="No blockers mentioned." />
          </>
        )}

        <details className="group">
          <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-300 transition-colors">
            View raw transcript
          </summary>
          <p className="mt-3 text-gray-400 text-sm bg-gray-900 rounded-xl p-4 leading-relaxed">
            {transcript}
          </p>
        </details>

        {!editing && <FeedbackForm reportId={id} />}
      </div>
    </div>
  );
}
