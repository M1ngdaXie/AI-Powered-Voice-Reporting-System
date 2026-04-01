import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { avatarColor, initials } from "../utils/avatar";

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
    fetch("/api/feedback", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4f46e5] dark:border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d] flex flex-col items-center justify-center p-6">
        <p className="text-[#64748b] dark:text-[#6b7280] text-sm mb-4">No feedback collected yet.</p>
        <Link
          to="/manager"
          className="text-[#7c3aed] dark:text-[#a78bfa] text-sm hover:opacity-80 transition-opacity"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const { summary, entries } = data;
  const filtered = filter
    ? entries.filter((e) => e.accurate === filter)
    : entries;

  const accurateBarColors: Record<string, string> = {
    Yes: "bg-gradient-to-r from-[#4ade80] to-[#22c55e]",
    Somewhat: "bg-gradient-to-r from-[#facc15] to-[#eab308]",
    No: "bg-gradient-to-r from-[#f87171] to-[#ef4444]",
  };

  const easierBarColors: Record<string, string> = {
    "Much easier": "bg-gradient-to-r from-[#4ade80] to-[#22c55e]",
    "About the same": "bg-gradient-to-r from-[#facc15] to-[#eab308]",
    Harder: "bg-gradient-to-r from-[#f87171] to-[#ef4444]",
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d]">
      <Navbar backTo={{ href: "/manager", label: "Dashboard" }} />
      <div className="max-w-2xl mx-auto px-4 pb-6 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-[#1e293b] dark:text-white text-2xl font-extrabold">
            Feedback Overview
          </h1>
          <p className="text-[#64748b] dark:text-[#6b7280] text-sm mt-1">
            AI accuracy &amp; ease ratings from your team
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Total Responses"
            value={summary.total.toString()}
          />
          <StatCard
            label="Said Accurate"
            value={`${pct(summary.accurate["Yes"] ?? 0, summary.total)}%`}
            sub={`${summary.accurate["Yes"] ?? 0} of ${summary.total}`}
            variant="green"
          />
          <StatCard
            label="Said Much Easier"
            value={`${pct(summary.easier["Much easier"] ?? 0, summary.total)}%`}
            sub={`${summary.easier["Much easier"] ?? 0} of ${summary.total}`}
            variant="blue"
          />
        </div>

        {/* Breakdown cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BreakdownCard
            title="Report Accuracy"
            counts={summary.accurate}
            total={summary.total}
            order={["Yes", "Somewhat", "No"]}
            barColors={accurateBarColors}
          />
          <BreakdownCard
            title="Easier Than Writing?"
            counts={summary.easier}
            total={summary.total}
            order={["Much easier", "About the same", "Harder"]}
            barColors={easierBarColors}
          />
        </div>

        {/* Filter row + entries */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[#64748b] dark:text-[#9ca3af] text-sm">
              Filter by accuracy:
            </span>
            <button
              onClick={() => setFilter(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filter === null
                  ? "bg-[#ede9fe] dark:bg-[#8b5cf620] border-[#c4b5fd] dark:border-[#8b5cf650] text-[#7c3aed] dark:text-[#a78bfa]"
                  : "bg-[#f1f5f9] dark:bg-[#1f1f1f] border-[#e2e8f0] dark:border-[#333] text-[#64748b] dark:text-[#6b7280]"
              }`}
            >
              All
            </button>
            {["Yes", "Somewhat", "No"].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(filter === opt ? null : opt)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filter === opt
                    ? "bg-[#ede9fe] dark:bg-[#8b5cf620] border-[#c4b5fd] dark:border-[#8b5cf650] text-[#7c3aed] dark:text-[#a78bfa]"
                    : "bg-[#f1f5f9] dark:bg-[#1f1f1f] border-[#e2e8f0] dark:border-[#333] text-[#64748b] dark:text-[#6b7280]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Section title */}
          <h2 className="text-[#1e293b] dark:text-[#e2e8f0] text-base font-semibold">
            Individual Responses
          </h2>

          {/* Entry list */}
          <div className="space-y-3">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-xl p-4 space-y-2"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: avatarColor(entry.workerName) }}
                    >
                      {initials(entry.workerName)}
                    </div>
                    <span className="text-[#1e293b] dark:text-[#d4d4d4] text-sm font-semibold">
                      {entry.workerName}
                    </span>
                  </div>
                  <span className="text-[#94a3b8] dark:text-[#6b7280] text-xs">
                    {new Date(entry.timestamp + "Z").toLocaleString()}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <Pill label="Accurate" value={entry.accurate} />
                  <Pill label="Easier" value={entry.easier} />
                </div>

                {/* Comment */}
                {entry.comment && (
                  <p className="text-[#64748b] dark:text-[#6b7280] text-sm italic">
                    "{entry.comment}"
                  </p>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-[#94a3b8] dark:text-[#6b7280] text-sm text-center py-8">
                No responses match this filter.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  variant,
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: "green" | "blue";
}) {
  const containerClass =
    variant === "green"
      ? "bg-[#f0fdf4] dark:bg-[#0a1a0a] border-[#bbf7d0] dark:border-[#16a34a30]"
      : variant === "blue"
      ? "bg-[#eff6ff] dark:bg-[#080f1f] border-[#bfdbfe] dark:border-[#3b82f630]"
      : "bg-white dark:bg-[#161616] border-[#e2e8f0] dark:border-[#2a2a2a]";

  const valueClass =
    variant === "green"
      ? "text-[#15803d] dark:text-[#4ade80]"
      : variant === "blue"
      ? "text-[#1d4ed8] dark:text-[#60a5fa]"
      : "text-[#1e293b] dark:text-white";

  return (
    <div className={`border rounded-2xl p-5 text-center ${containerClass}`}>
      <p className={`text-3xl font-extrabold ${valueClass}`}>{value}</p>
      <p className="text-[#64748b] dark:text-[#6b7280] text-sm mt-1">{label}</p>
      {sub && <p className="text-[#94a3b8] dark:text-[#6b7280] text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function BreakdownCard({
  title,
  counts,
  total,
  order,
  barColors,
}: {
  title: string;
  counts: Record<string, number>;
  total: number;
  order: string[];
  barColors: Record<string, string>;
}) {
  return (
    <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 space-y-4">
      <h3 className="text-[#64748b] dark:text-[#9ca3af] text-xs font-semibold uppercase tracking-wider">
        {title}
      </h3>
      {order.map((key) => {
        const count = counts[key] ?? 0;
        const width = total > 0 ? (count / total) * 100 : 0;
        const pctStr = pct(count, total);
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[#1e293b] dark:text-[#e2e8f0] text-sm">{key}</span>
              <span className="text-[#1e293b] dark:text-[#e2e8f0] text-sm font-semibold">
                {pctStr}%
              </span>
            </div>
            <div className="bg-[#f1f5f9] dark:bg-[#1f1f1f] rounded-full h-[5px] overflow-hidden">
              <div
                className={`h-full rounded-full ${barColors[key] ?? ""}`}
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
    Yes: "bg-[#f0fdf4] dark:bg-[#16a34a20] border-[#bbf7d0] dark:border-[#16a34a40] text-[#15803d] dark:text-[#4ade80]",
    Somewhat:
      "bg-[#fefce8] dark:bg-[#eab30820] border-[#fef08a] dark:border-[#eab30840] text-[#a16207] dark:text-[#facc15]",
    No: "bg-[#fef2f2] dark:bg-[#ef444420] border-[#fecaca] dark:border-[#ef444440] text-[#dc2626] dark:text-[#f87171]",
    "Much easier":
      "bg-[#f0fdf4] dark:bg-[#16a34a20] border-[#bbf7d0] dark:border-[#16a34a40] text-[#15803d] dark:text-[#4ade80]",
    "About the same":
      "bg-[#fefce8] dark:bg-[#eab30820] border-[#fef08a] dark:border-[#eab30840] text-[#a16207] dark:text-[#facc15]",
    Harder:
      "bg-[#fef2f2] dark:bg-[#ef444420] border-[#fecaca] dark:border-[#ef444440] text-[#dc2626] dark:text-[#f87171]",
  };
  const cls =
    colorMap[value] ??
    "bg-[#f1f5f9] dark:bg-[#1f1f1f] border-[#e2e8f0] dark:border-[#333] text-[#64748b] dark:text-[#6b7280]";
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${cls}`}>
      {label}: {value}
    </span>
  );
}
