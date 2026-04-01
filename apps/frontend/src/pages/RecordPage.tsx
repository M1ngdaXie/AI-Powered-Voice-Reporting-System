import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AudioWaveform from "../components/AudioWaveform";
import ProgressSteps from "../components/ProgressSteps";
import HelpModal from "../components/HelpModal";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

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
  const { auth } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [recordingSource, setRecordingSource] = useState<"mic" | "upload" | null>(null);
  const workerName = auth.status === "authenticated" ? auth.name : "";
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);
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

      const res = await fetch("/api/transcribe", {
        method: "POST",
        credentials: "include",
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d] text-[#1e293b] dark:text-white">
      <Navbar showMyReports showSignOut />
      <div className="flex flex-col items-center px-6 pb-6">
      <div className="w-full max-w-md">

        {/* Username pill */}
        {workerName && (
          <div className="flex justify-center mb-5">
            <span className="bg-[#ede9fe] dark:bg-[#8b5cf6]/10 text-[#5b21b6] dark:text-[#a78bfa] font-semibold px-3 py-1 rounded-full border border-[#c4b5fd] dark:border-[#8b5cf6]/30 text-sm">
              {workerName}
            </span>
          </div>
        )}

        <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />

        {/* Progress stepper */}
        {loadingStep && (
          <div className="mb-6 bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-6 shadow-[0_2px_8px_rgba(79,70,229,0.08)] dark:shadow-none">
            <ProgressSteps currentStep={loadingStep} />
          </div>
        )}

        {!loadingStep && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Onboarding tooltip */}
            {showOnboarding && (
              <div className="relative bg-[#4f46e5] dark:bg-gradient-to-r dark:from-[#8b5cf6] dark:to-[#3b82f6] text-white rounded-2xl p-4 shadow-xl">
                <p className="text-sm font-medium mb-1">Welcome! Tap the mic below to record your work update.</p>
                <p className="text-indigo-200 dark:text-white/70 text-xs mb-3">We'll turn your voice into a structured report automatically.</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem("onboarded", "true");
                  }}
                  className="text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                >
                  Got it
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-[#4f46e5] dark:bg-[#8b5cf6] rotate-45 -mt-1.5" />
              </div>
            )}

            {/* Main record card */}
            <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#8b5cf6]/20 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-[0_4px_16px_rgba(79,70,229,0.08)] dark:shadow-none relative overflow-hidden">
              {/* Gradient top bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6]" />

              {/* "NEW UPDATE" label */}
              <span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#4f46e5] dark:text-[#8b5cf6]">
                NEW UPDATE
              </span>

              {/* Mic button with tooltip */}
              <div className="relative group flex flex-col items-center">
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-[#1e293b] dark:bg-[#e2e8f0] text-white dark:text-[#1e293b] text-xs px-3 py-1.5 rounded-lg shadow-lg text-center max-w-50 whitespace-normal">
                    {isRecording ? "Tap to stop recording" : "Tap to record your work update — we'll transcribe it automatically"}
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-[#1e293b] dark:bg-[#e2e8f0] rotate-45 -mt-1" />
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                    isRecording
                      ? "bg-[#dc2626] dark:bg-[#ef4444] shadow-[0_0_24px_rgba(239,68,68,0.5)] animate-pulse"
                      : "bg-[#4f46e5] dark:bg-gradient-to-br dark:from-[#8b5cf6] dark:to-[#3b82f6] shadow-[0_8px_24px_rgba(79,70,229,0.35)] dark:shadow-[0_0_24px_rgba(139,92,246,0.4)] hover:opacity-90"
                  }`}
                >
                  {isRecording ? "⏹️" : "🎙️"}
                </button>
              </div>

              {/* Waveform inside the card */}
              {isRecording && analyser && <AudioWaveform analyser={analyser} />}

              {/* Status text */}
              <p className={`text-sm font-medium ${isRecording ? "text-[#dc2626] dark:text-[#f87171]" : "text-[#64748b] dark:text-[#9ca3af]"}`}>
                {isRecording
                  ? durationSec < 5
                    ? `Recording · ${durationSec}s (min 5s)`
                    : `Recording · ${durationSec}s — tap to stop`
                  : "Tap to record"}
              </p>

              {/* Re-record button */}
              {file && recordingSource === "mic" && !isRecording && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full text-sm text-[#64748b] dark:text-[#9ca3af] hover:text-[#1e293b] dark:hover:text-white border border-[#e2e8f0] dark:border-[#333] hover:border-[#4f46e5] dark:hover:border-[#8b5cf6] rounded-xl py-2 transition-colors"
                >
                  Re-record
                </button>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 w-full">
                <div className="h-px flex-1 bg-[#e2e8f0] dark:bg-[#1f1f1f]" />
                <span className="text-[#94a3b8] dark:text-[#6b7280] text-xs uppercase">or</span>
                <div className="h-px flex-1 bg-[#e2e8f0] dark:bg-[#1f1f1f]" />
              </div>

              {/* File upload */}
              <div
                className="w-full border-2 border-dashed border-[#cbd5e1] dark:border-[#444] rounded-xl p-6 text-center cursor-pointer hover:border-[#4f46e5] dark:hover:border-[#8b5cf6] transition-colors bg-[#f8fafc] dark:bg-[#1f1f1f]"
                onClick={() => document.getElementById("audio-input")?.click()}
                title="Upload a pre-recorded audio file instead of using the mic. Supports mp3, wav, m4a, webm up to 25 MB."
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
                    <p className="text-[#4f46e5] dark:text-[#a78bfa] font-semibold text-sm">{file.name}</p>
                    <p className="text-[#64748b] dark:text-[#9ca3af] text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[#64748b] dark:text-[#9ca3af] text-sm">Click to select an audio file</p>
                    <p className="text-[#94a3b8] dark:text-[#6b7280] text-xs mt-1">mp3, wav, m4a, webm supported</p>
                  </div>
                )}
              </div>

              {/* Error messages */}
              {error && (
                <div
                  className={`w-full text-sm rounded-xl px-4 py-3 border ${
                    errorType === "mic" || errorType === "api"
                      ? "text-[#dc2626] dark:text-[#f87171] bg-[#fef2f2] dark:bg-[#160808] border-[#fecaca] dark:border-[#ef4444]/30"
                      : "text-[#92400e] dark:text-[#fbbf24] bg-[#fffbeb] dark:bg-[#1a1000] border-[#fde68a] dark:border-[#f59e0b]/30"
                  }`}
                >
                  {error}
                </div>
              )}

              {/* Submit with disabled tooltip */}
              <div className="relative w-full">
                {disabledTooltip && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1e293b] dark:bg-[#e2e8f0] text-white dark:text-[#1e293b] text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-10">
                    {disabledTooltip}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-[#1e293b] dark:bg-[#e2e8f0] rotate-45 -mt-1" />
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
                  className={`w-full bg-[#4f46e5] dark:bg-gradient-to-r dark:from-[#8b5cf6] dark:to-[#3b82f6] text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90 ${
                    !file || isRecording ? "opacity-40" : ""
                  }`}
                >
                  ↑ Submit Recording
                </button>
              </div>

              {/* Hint */}
              <p className="text-center text-[#94a3b8] dark:text-[#4b5563] text-xs">
                Submit to generate your report · Min. 5 seconds · <Link to="/help" className="underline hover:text-[#4f46e5] dark:hover:text-[#a78bfa] transition-colors">Need help?</Link>
              </p>
            </div>

            {/* Progress steps card (bottom) */}
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
