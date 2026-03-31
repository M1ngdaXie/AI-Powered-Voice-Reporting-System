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
                  ? "bg-green-500"
                  : isActive
                    ? "bg-indigo-500 animate-pulse"
                    : "bg-gray-700"
              }`}
            >
              {isComplete ? (
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : isActive ? (
                <div className="w-2 h-2 rounded-full bg-white" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-500" />
              )}
            </div>

            {/* Label */}
            <span
              className={`text-sm ${
                isComplete
                  ? "text-green-400"
                  : isActive
                    ? "text-white font-medium"
                    : "text-gray-600"
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
