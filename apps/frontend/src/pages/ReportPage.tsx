import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Section from "../components/Section";
import EditableSection from "../components/EditableSection";
import FeedbackForm from "../components/FeedbackForm";
import type { Report } from "../types";

interface LocationState {
  id: number;
  transcript: string;
  report: Report;
}

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [report, setReport] = useState<Report | null>(state?.report ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Report | null>(null);
  const [saving, setSaving] = useState(false);

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
    setEditing(false);
    setDraft(null);
  }

  async function saveEdit() {
    if (!draft) return;
    setSaving(true);
    try {
      const cleaned = {
        summary: draft.summary,
        tasksCompleted: draft.tasksCompleted.filter((s) => s.trim()),
        tasksInProgress: draft.tasksInProgress.filter((s) => s.trim()),
        blockers: draft.blockers.filter((s) => s.trim()),
      };
      const res = await fetch(`/api/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      if (!res.ok) throw new Error();
      setReport(cleaned);
      setEditing(false);
      setDraft(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
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
              onClick={() => navigate("/")}
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
