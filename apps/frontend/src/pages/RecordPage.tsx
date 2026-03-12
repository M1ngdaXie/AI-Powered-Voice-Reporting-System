import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RecordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Something went wrong");
      }

      const data = await res.json();
      navigate("/report", { state: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Voice Work Report</h1>
        <p className="text-gray-400 mb-8">Upload an audio file and we'll generate your report.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
            onClick={() => document.getElementById("audio-input")?.click()}
          >
            <input
              id="audio-input"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div>
                <p className="text-indigo-400 font-medium">{file.name}</p>
                <p className="text-gray-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400">Click to select an audio file</p>
                <p className="text-gray-600 text-sm mt-1">mp3, wav, m4a, webm supported</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Generating report..." : "Generate Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
