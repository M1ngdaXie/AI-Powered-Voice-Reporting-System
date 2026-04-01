interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { icon: "🎙", title: "Record or upload", desc: "Tap the mic to record your work update, or upload an audio file." },
  { icon: "🤖", title: "AI transcribes", desc: "We use AI to turn your speech into text automatically." },
  { icon: "✏️", title: "Review & edit", desc: "See your structured report. Edit anything before it's final." },
  { icon: "📊", title: "Manager views", desc: "Your manager sees all reports in a dashboard with status and blockers." },
];

export default function HelpModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[#1e293b] dark:text-white text-lg font-bold">How it works</h2>
          <button
            onClick={onClose}
            className="text-[#94a3b8] dark:text-[#6b7280] hover:text-[#1e293b] dark:hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f1f5f9] dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] flex items-center justify-center text-lg shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="text-[#1e293b] dark:text-white text-sm font-medium">
                  {i + 1}. {step.title}
                </p>
                <p className="text-[#64748b] dark:text-[#9ca3af] text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="bg-[#f1f5f9] dark:bg-[#161616] hover:bg-[#e2e8f0] dark:hover:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#2a2a2a] text-[#1e293b] dark:text-white py-2.5 rounded-xl text-sm font-medium transition-colors w-full"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
