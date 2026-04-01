type Step = "uploading" | "transcribing" | "structuring" | "done";

const STEPS: { key: Step; label: string }[] = [
  { key: "uploading", label: "Uploading audio" },
  { key: "transcribing", label: "Transcribing speech" },
  { key: "structuring", label: "Structuring report" },
  { key: "done", label: "Done!" },
];

interface Props {
  currentStep: Step;
}

export default function ProgressSteps({ currentStep }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-3">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-3">
            {/* Circle */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                isComplete
                  ? "bg-[#f0fdf4] dark:bg-[#16a34a30] border border-[#bbf7d0] dark:border-[#16a34a40]"
                  : isActive
                    ? "bg-[#ede9fe] dark:bg-[#8b5cf620] border border-[#c4b5fd] dark:border-[#8b5cf640] animate-pulse"
                    : "bg-[#f1f5f9] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#333]"
              }`}
            >
              {isComplete ? (
                <svg className="w-3.5 h-3.5 text-[#15803d] dark:text-[#4ade80]" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : isActive ? (
                <div className="w-2 h-2 rounded-full bg-[#7c3aed] dark:bg-[#a78bfa]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-[#94a3b8] dark:bg-[#4b5563]" />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-sm ${
                isComplete
                  ? "text-[#15803d] dark:text-[#4ade80]"
                  : isActive
                    ? "text-[#1e293b] dark:text-white font-medium"
                    : "text-[#94a3b8] dark:text-[#6b7280]"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
