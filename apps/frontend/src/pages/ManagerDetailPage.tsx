import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Section from "../components/Section";
import type { ReportRecord } from "../types";

export default function ManagerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${id}`)
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
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">Report not found.</p>
        <button
          onClick={() => navigate("/manager")}
          className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{report.workerName}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {new Date(report.timestamp + "Z").toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => navigate("/manager")}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Back
          </button>
        </div>

        <p className="text-gray-400 text-sm">{report.summary}</p>

        <Section title="Tasks Completed" color="green" items={report.tasksCompleted} empty="No completed tasks mentioned." />
        <Section title="In Progress" color="blue" items={report.tasksInProgress} empty="No in-progress tasks mentioned." />
        <Section title="Blockers" color="red" items={report.blockers} empty="No blockers mentioned." />

        <details className="group">
          <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-300 transition-colors">
            View raw transcript
          </summary>
          <p className="mt-3 text-gray-400 text-sm bg-gray-900 rounded-xl p-4 leading-relaxed">
            {report.transcript}
          </p>
        </details>
      </div>
    </div>
  );
}
