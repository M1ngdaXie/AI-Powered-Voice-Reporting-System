import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AudioWaveform from "../components/AudioWaveform";
import ProgressSteps from "../components/ProgressSteps";
import HelpModal from "../components/HelpModal";

type LoadingStep = "uploading" | "transcribing" | "structuring" | "done";
type ErrorType = "validation" | "mic" | "api" | "size" | null;

function getMicDenialHelp(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg"))
    return "Click the lock/tune icon in the address bar → Site settings → Microphone → Allow.";
  if (ua.includes("Firefox"))
    return "Click the permissions icon (left of URL bar) → Clear mic block → Reload.";
  if (ua.includes("Safari"))
    return "Go to Safari → Settings → Websites → Microphone → Allow for this site.";
  if (ua.includes("Edg"))
    return "Click the lock icon in the address bar → Permissions → Microphone → Allow.";
  return "Check your browser settings to allow microphone access for this site.";
}

export default function RecordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [recordingSource, setRecordingSource] = useState<"mic" | "upload" | null>(null);
  const [workerName, setWorkerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [disabledTooltip, setDisabledTooltip] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [loadingStep, setLoadingStep] = useState<LoadingStep | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarded"),
  );
  const navigate = useNavigate();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recordingStartRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setErrorWithType(msg: string, type: ErrorType) {
    setError(msg);
    setErrorType(type);
  }

  function clearError() {
    setError(null);
    setErrorType(null);
  }

  function showDisabledTooltip() {
    let reason = "";
    if (isRecording) reason = "Stop recording first";
    else if (!file) reason = "Record or upload audio first";
    else if (loadingStep) reason = "Report is generating...";
    if (!reason) return;
    setDisabledTooltip(reason);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => setDisabledTooltip(null), 2000);
  }

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      stepTimersRef.current.forEach(clearTimeout);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  async function startRecording() {
    // Confirm overwrite if file already exists
    if (file && !window.confirm("Discard current recording and record again?")) {
      return;
    }

    clearError();
    setFile(null);
    setRecordingSource(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up Web Audio API for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      audioCtxRef.current = audioCtx;
      setAnalyser(analyserNode);

      // Set up MediaRecorder
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
        setRecordingSource("mic");
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingStartRef.current = Date.now();
      setRecordingDuration(0);

      // Update duration every 100ms
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Date.now() - recordingStartRef.current);
      }, 100);
    } catch {
      setErrorWithType(
        `Microphone access denied. ${getMicDenialHelp()}`,
        "mic",
      );
    }
  }

  function stopRecording() {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    const elapsed = Date.now() - recordingStartRef.current;

    // Clean up audio context
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setAnalyser(null);
    setIsRecording(false);
    setRecordingDuration(0);

    // Enforce minimum 5 seconds
    if (elapsed < 5000) {
      mediaRecorderRef.current?.stop();
      // Discard the recording
      chunksRef.current = [];
      setErrorWithType("Recording must be at least 5 seconds. Please try again.", "validation");
      return;
    }

    mediaRecorderRef.current?.stop();
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function handleFileUpload(uploadedFile: File) {
    if (file && recordingSource === "mic") {
      if (!window.confirm("Discard current recording and use this file instead?")) {
        return;
      }
    }
    setFile(uploadedFile);
    setRecordingSource("upload");
    clearError();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || loadingStep) return;

    // Name validation
    if (!workerName.trim()) {
      setNameError("Please enter your name");
      return;
    }

    // MIME type validation
    if (file.type && !file.type.startsWith("audio/")) {
      setErrorWithType("Please select an audio file (mp3, wav, m4a, webm).", "validation");
      return;
    }

    // Size validation
    if (file.size > 25 * 1024 * 1024) {
      setErrorWithType("File too large. Maximum size is 25MB.", "size");
      return;
    }

    clearError();
    setLoadingStep("uploading");

    // Simulated progress steps
    const t1 = setTimeout(() => setLoadingStep("transcribing"), 1500);
    const t2 = setTimeout(() => setLoadingStep("structuring"), 4000);
    stepTimersRef.current = [t1, t2];

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

      // Clear simulated timers and show done
      stepTimersRef.current.forEach(clearTimeout);
      setLoadingStep("done");

      // Navigate after brief "done" display
      setTimeout(() => {
        navigate("/report", { state: { ...data, justGenerated: true } });
      }, 800);
    } catch (err) {
      stepTimersRef.current.forEach(clearTimeout);
      setLoadingStep(null);
      setErrorWithType(
        err instanceof Error ? err.message : "Unknown error",
        "api",
      );
    }
  }

  const durationSec = Math.floor(recordingDuration / 1000);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Voice Work Report</h1>
          <button
            onClick={() => setShowHelp(true)}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-sm transition-colors"
          >
            ?
          </button>
        </div>
        <p className="text-gray-400 mb-8">Record or upload audio and we'll generate your report.</p>

        <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />

        {/* Progress stepper overlay */}
        {loadingStep && (
          <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <ProgressSteps currentStep={loadingStep} />
          </div>
        )}

        {!loadingStep && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Your name"
                value={workerName}
                onChange={(e) => {
                  setWorkerName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                className={`w-full bg-gray-900 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  nameError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-700 focus:border-indigo-500"
                }`}
              />
              {nameError && (
                <p className="text-red-400 text-xs mt-1.5 ml-1">{nameError}</p>
              )}
            </div>

            {/* Onboarding tooltip */}
            {showOnboarding && (
              <div className="relative bg-indigo-600 text-white rounded-xl p-4 shadow-xl">
                <p className="text-sm font-medium mb-1">Welcome! Tap the mic below to record your work update.</p>
                <p className="text-indigo-200 text-xs mb-3">We'll turn your voice into a structured report automatically.</p>
                <button
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem("onboarded", "true");
                  }}
                  className="text-xs font-medium bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded-lg transition-colors"
                >
                  Got it
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-indigo-600 rotate-45 -mt-1.5" />
              </div>
            )}

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

              {/* Waveform */}
              {isRecording && analyser && <AudioWaveform analyser={analyser} />}

              <p className={`text-sm ${isRecording ? "text-red-400" : "text-gray-500"}`}>
                {isRecording
                  ? `Recording... ${durationSec}s${durationSec < 5 ? " (min 5s)" : " — tap to stop"}`
                  : "Tap to record"}
              </p>
            </div>

            {/* Re-record button */}
            {file && recordingSource === "mic" && !isRecording && (
              <button
                type="button"
                onClick={startRecording}
                className="w-full text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl py-2 transition-colors"
              >
                Re-record
              </button>
            )}

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
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
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
              <div
                className={`text-sm rounded-lg px-4 py-3 border ${
                  errorType === "mic" || errorType === "api"
                    ? "text-red-400 bg-red-950 border-red-800"
                    : "text-yellow-400 bg-yellow-950 border-yellow-800"
                }`}
              >
                {error}
              </div>
            )}

            {/* Submit with disabled tooltip */}
            <div className="relative">
              {disabledTooltip && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-10">
                  {disabledTooltip}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-gray-800 rotate-45 -mt-1" />
                </div>
              )}
              <button
                type="submit"
                disabled={!file || isRecording}
                onClick={(e) => {
                  if (!file || isRecording || loadingStep) {
                    e.preventDefault();
                    showDisabledTooltip();
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Generate Report
              </button>
            </div>
          </form>
        )}

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
