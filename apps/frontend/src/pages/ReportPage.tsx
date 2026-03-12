import { useLocation, useNavigate } from "react-router-dom";

interface Report {
  tasksCompleted: string[];
  tasksInProgress: string[];
  blockers: string[];
  summary: string;
}

interface LocationState {
  transcript: string;
  report: Report;
}

export default function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  if (!state) {
    navigate("/");
    return null;
  }

  const { transcript, report } = state;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Work Status Report</h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← New Report
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
            {transcript}
          </p>
        </details>
      </div>
    </div>
  );
}

function Section({
  title,
  color,
  items,
  empty,
}: {
  title: string;
  color: "green" | "blue" | "red";
  items: string[];
  empty: string;
}) {
  const colors = {
    green: "border-green-800 bg-green-950/40",
    blue: "border-blue-800 bg-blue-950/40",
    red: "border-red-800 bg-red-950/40",
  };
  const titleColors = {
    green: "text-green-400",
    blue: "text-blue-400",
    red: "text-red-400",
  };

  return (
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <h2 className={`font-semibold text-sm uppercase tracking-wider mb-3 ${titleColors[color]}`}>
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-gray-600 text-sm italic">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-gray-200 text-sm flex gap-2">
              <span className="text-gray-600 mt-0.5">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
