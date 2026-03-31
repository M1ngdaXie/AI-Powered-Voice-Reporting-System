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
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">How it works</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {i + 1}. {step.title}
                </p>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
