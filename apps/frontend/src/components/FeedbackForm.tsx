import { useEffect, useState } from "react";

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
    fetch(`/api/feedback/check/${reportId}`)
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
      <div className="border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-green-400 font-medium">Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-800 rounded-xl p-6 space-y-5">
      <h3 className="font-semibold text-lg">Quick Feedback</h3>
      <p className="text-gray-500 text-sm">Help us understand if this is useful.</p>

      <div>
        <p className="text-gray-300 text-sm mb-2">Was this report accurate?</p>
        <div className="flex gap-2">
          {accurateOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setAccurate(opt)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors border ${
                accurate === opt
                  ? "border-indigo-500 bg-indigo-950 text-indigo-300"
                  : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-gray-300 text-sm mb-2">Was speaking easier than writing a report?</p>
        <div className="flex gap-2">
          {easierOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setEasier(opt)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors border ${
                easier === opt
                  ? "border-indigo-500 bg-indigo-950 text-indigo-300"
                  : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-gray-300 text-sm mb-2">Any other thoughts? <span className="text-gray-600">(optional)</span></p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What worked well? What felt confusing?"
          rows={3}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-300 text-sm placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!accurate || !easier || submitting}
        className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-700 text-white font-medium py-2 px-6 rounded-xl transition-colors text-sm"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}
