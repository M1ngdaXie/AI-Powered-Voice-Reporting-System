import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface FeedbackEntry {
  id: number;
  reportId: number;
  workerName: string;
  accurate: string;
  easier: string;
  comment: string;
  timestamp: string;
}

interface Summary {
  total: number;
  accurate: Record<string, number>;
  easier: Record<string, number>;
}

interface FeedbackData {
  summary: Summary;
  entries: FeedbackEntry[];
}

function pct(count: number, total: number) {
  if (total === 0) return "0";
  return Math.round((count / total) * 100).toString();
}

export default function FeedbackPage() {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/feedback")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-500">Loading feedback...</p>
      </div>
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 mb-4">No feedback collected yet.</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
          ← Back to home
        </Link>
      </div>
    );
  }

  const { summary, entries } = data;
  const filtered = filter
    ? entries.filter((e) => e.accurate === filter)
    : entries;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Feedback Overview</h1>
          <Link to="/manager" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Dashboard
          </Link>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Total Responses"
            value={summary.total.toString()}
          />
          <StatCard
            label="Said Accurate"
            value={`${pct(summary.accurate["Yes"] ?? 0, summary.total)}%`}
            sub={`${summary.accurate["Yes"] ?? 0} of ${summary.total}`}
          />
          <StatCard
            label="Said Easier"
            value={`${pct(summary.easier["Much easier"] ?? 0, summary.total)}%`}
            sub={`${summary.easier["Much easier"] ?? 0} of ${summary.total}`}
          />
        </div>

        {/* Breakdown bars */}
        <div className="grid grid-cols-2 gap-6">
          <BreakdownCard
            title="Report Accuracy"
            counts={summary.accurate}
            total={summary.total}
            order={["Yes", "Somewhat", "No"]}
            colors={{ Yes: "bg-green-500", Somewhat: "bg-yellow-500", No: "bg-red-500" }}
          />
          <BreakdownCard
            title="Easier Than Writing?"
            counts={summary.easier}
            total={summary.total}
            order={["Much easier", "About the same", "Harder"]}
            colors={{ "Much easier": "bg-green-500", "About the same": "bg-yellow-500", Harder: "bg-red-500" }}
          />
        </div>

        {/* Filter + individual entries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Individual Responses</h2>
            <div className="flex gap-2">
              {["Yes", "Somewhat", "No"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(filter === opt ? null : opt)}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors border ${
                    filter === opt
                      ? "border-indigo-500 bg-indigo-950 text-indigo-300"
                      : "border-gray-700 bg-gray-900 text-gray-500 hover:border-gray-600"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm font-medium">{entry.workerName}</span>
                  <span className="text-gray-600 text-xs">
                    {new Date(entry.timestamp + "Z").toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-3 text-xs">
                  <Pill label="Accurate" value={entry.accurate} />
                  <Pill label="Easier" value={entry.easier} />
                </div>
                {entry.comment && (
                  <p className="text-gray-400 text-sm mt-1">"{entry.comment}"</p>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-4">No responses match this filter.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function BreakdownCard({
  title,
  counts,
  total,
  order,
  colors,
}: {
  title: string;
  counts: Record<string, number>;
  total: number;
  order: string[];
  colors: Record<string, string>;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      {order.map((key) => {
        const count = counts[key] ?? 0;
        const width = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{key}</span>
              <span>{count}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colors[key]}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  const colorMap: Record<string, string> = {
    Yes: "text-green-400 bg-green-950 border-green-800",
    Somewhat: "text-yellow-400 bg-yellow-950 border-yellow-800",
    No: "text-red-400 bg-red-950 border-red-800",
    "Much easier": "text-green-400 bg-green-950 border-green-800",
    "About the same": "text-yellow-400 bg-yellow-950 border-yellow-800",
    Harder: "text-red-400 bg-red-950 border-red-800",
  };
  const cls = colorMap[value] ?? "text-gray-400 bg-gray-900 border-gray-700";
  return (
    <span className={`px-2 py-0.5 rounded border ${cls}`}>
      {label}: {value}
    </span>
  );
}
