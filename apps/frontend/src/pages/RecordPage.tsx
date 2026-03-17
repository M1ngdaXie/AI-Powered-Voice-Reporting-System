import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

type RecordingState = "idle" | "recording";

export default function RecordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [workerName, setWorkerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const navigate = useNavigate();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const recorded = new File([blob], "recording.webm", { type: "audio/webm" });
        setFile(recorded);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecordingState("recording");
    } catch {
      setError("Microphone access denied. Please allow mic permissions and try again.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecordingState("idle");
  }

  function toggleRecording() {
    if (recordingState === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError("File too large. Maximum size is 25MB.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("workerName", workerName.trim() || "Anonymous");

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

  const isRecording = recordingState === "recording";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">Voice Work Report</h1>
        <p className="text-gray-400 mb-8">Record or upload audio and we'll generate your report.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Your name"
            value={workerName}
            onChange={(e) => setWorkerName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />

          {/* Mic button */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-600 hover:bg-red-500 animate-pulse"
                  : "bg-gray-800 hover:bg-gray-700 border border-gray-600"
              }`}
            >
              {isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2Z" />
                </svg>
              )}
            </button>
            <p className={`text-sm ${isRecording ? "text-red-400" : "text-gray-500"}`}>
              {isRecording ? "Recording... tap to stop" : "Tap to record"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-gray-600 text-xs uppercase">or upload a file</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* File upload */}
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
            disabled={!file || loading || isRecording}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Generating report..." : "Generate Report"}
          </button>
        </form>

        <Link
          to="/manager"
          className="block text-center text-gray-500 hover:text-gray-300 text-sm mt-6 transition-colors"
        >
          Manager View →
        </Link>
      </div>
    </div>
  );
}
