import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

interface Props {
  reportId: number;
}

const accurateOptions = ["Yes", "Somewhat", "No"] as const;
const easierOptions = ["Much easier", "About the same", "Harder"] as const;

export default function FeedbackForm({ reportId }: Props) {
  const [accurate, setAccurate] = useState<string | null>(null);
  const [easier, setEasier] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`/api/feedback/check/${reportId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.submitted) setSubmitted(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [reportId]);

  async function handleSubmit() {
    if (!accurate || !easier) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, accurate, easier, comment }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit feedback");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) return null;

  if (submitted) {
    return (
      <div className="bg-[#f0fdf4] dark:bg-[#0a1a0a] border border-[#bbf7d0] dark:border-[#16a34a]/30 rounded-xl p-4 text-[#15803d] dark:text-[#4ade80] text-sm">
        ✓ Feedback submitted — thanks!
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={14} className="text-[#64748b] dark:text-[#9ca3af]" />
        <span className="text-[#64748b] dark:text-[#9ca3af] text-xs font-bold uppercase tracking-widest">Feedback</span>
      </div>

      {/* Was this report accurate? */}
      <div className="mb-4">
        <p className="text-[#64748b] dark:text-[#9ca3af] text-sm mb-2">Was this report accurate?</p>
        <div className="flex gap-2 flex-wrap">
          {accurateOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAccurate(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                accurate === opt
                  ? "bg-[#ede9fe] dark:bg-[#8b5cf6]/20 border-[#c4b5fd] dark:border-[#8b5cf6]/50 text-[#5b21b6] dark:text-[#a78bfa]"
                  : "bg-[#f8fafc] dark:bg-[#1f1f1f] border-[#e2e8f0] dark:border-[#333] text-[#64748b] dark:text-[#9ca3af] hover:border-[#4f46e5] dark:hover:border-[#8b5cf6]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Was this easier than writing it yourself? */}
      <div className="mb-4">
        <p className="text-[#64748b] dark:text-[#9ca3af] text-sm mb-2">Was this easier than writing it yourself?</p>
        <div className="flex gap-2 flex-wrap">
          {easierOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setEasier(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                easier === opt
                  ? "bg-[#ede9fe] dark:bg-[#8b5cf6]/20 border-[#c4b5fd] dark:border-[#8b5cf6]/50 text-[#5b21b6] dark:text-[#a78bfa]"
                  : "bg-[#f8fafc] dark:bg-[#1f1f1f] border-[#e2e8f0] dark:border-[#333] text-[#64748b] dark:text-[#9ca3af] hover:border-[#4f46e5] dark:hover:border-[#8b5cf6]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Optional comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment..."
        className="w-full bg-[#f8fafc] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333] rounded-lg px-3 py-2 text-sm text-[#1e293b] dark:text-white placeholder:text-[#94a3b8] dark:placeholder:text-[#6b7280] focus:outline-none focus:border-[#4f46e5] dark:focus:border-[#8b5cf6] resize-none mb-3"
        rows={2}
      />

      {error && (
        <p className="text-[#dc2626] dark:text-[#f87171] text-sm mb-3">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!accurate || !easier || submitting}
        className="bg-[#4f46e5] dark:bg-gradient-to-r dark:from-[#8b5cf6] dark:to-[#3b82f6] text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}
