import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const HOW_IT_WORKS = [
  {
    icon: "🎙️",
    title: "Record your update",
    desc: "Tap the mic button on the home screen to start recording. Speak naturally about what you completed, what you're working on, and any blockers. Minimum 5 seconds.",
  },
  {
    icon: "📤",
    title: "Submit your recording",
    desc: "When finished, tap the mic again to stop, then click \"Submit Recording\". You can also upload an audio file (mp3, wav, m4a, webm) instead of recording live.",
  },
  {
    icon: "🤖",
    title: "AI structures your report",
    desc: "Our AI transcribes your audio and automatically organises it into three sections: Tasks Completed, In Progress, and Blockers — plus a summary.",
  },
  {
    icon: "✏️",
    title: "Review and edit",
    desc: "Check the generated report. If anything was misheard or needs adjusting, click \"Edit Report\" to make changes before sending it to your manager.",
  },
  {
    icon: "📨",
    title: "Submit to your manager",
    desc: "Once you're happy with the report, click \"Submit Report\". Your manager will then see it in their dashboard.",
  },
];

const FAQS = [
  {
    q: "My manager isn't seeing my report — what do I do?",
    a: "Generating a report does not automatically send it to your manager. You need to open the report and click the green \"Submit Report\" button. Until you do, it stays as a private draft.",
  },
  {
    q: "Can I edit my report after submitting it?",
    a: "Yes. Open the report, click \"Edit Report\", make your changes, and save. Your manager will see the updated version.",
  },
  {
    q: "Is my audio recording stored?",
    a: "No. Audio files are processed in real time for transcription and are not stored on our servers. Only the text transcript and structured report are saved.",
  },
  {
    q: "The microphone button isn't working — what should I check?",
    a: "Your browser needs permission to access the microphone. Look for a lock or camera icon in your address bar, click it, and set Microphone to \"Allow\". Then reload the page.",
  },
  {
    q: "What audio file formats are supported for upload?",
    a: "mp3, wav, m4a, and webm files up to 25 MB are supported.",
  },
  {
    q: "Why does the report sometimes miss something I said?",
    a: "AI transcription works best with clear audio and minimal background noise. Try recording in a quiet environment and speaking at a normal pace. You can always edit the report before submitting.",
  },
  {
    q: "Can I save a draft and come back to it later?",
    a: "Yes. After generating a report, click \"Save as Draft\" and it will appear under the Drafts tab on your My Reports page. You can return any time to edit and submit it.",
  },
];

export default function HelpPage() {
  const { auth } = useAuth();
  const backTo = auth.status === "authenticated" && auth.role === "manager" ? "/manager" : "/";

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0d0d] text-[#1e293b] dark:text-white">
      <Navbar backTo={{ href: backTo, label: auth.status === "authenticated" && auth.role === "manager" ? "Dashboard" : "Home" }} />
      <div className="max-w-2xl mx-auto px-4 pb-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#1e293b] dark:text-white mb-1">Help & FAQ</h1>
          <p className="text-[#64748b] dark:text-[#9ca3af] text-sm">Everything you need to get the most out of VoiceReport.</p>
        </div>

        {/* How it works */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4f46e5] dark:text-[#a78bfa] mb-4">How it works</h2>
          <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl overflow-hidden">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={i}
                className={`flex gap-4 p-4 ${i < HOW_IT_WORKS.length - 1 ? "border-b border-[#f1f5f9] dark:border-[#1f1f1f]" : ""}`}
              >
                <div className="w-9 h-9 rounded-full bg-[#f1f5f9] dark:bg-[#1f1f1f] border border-[#e2e8f0] dark:border-[#2a2a2a] flex items-center justify-center text-base shrink-0 mt-0.5">
                  {step.icon}
                </div>
                <div>
                  <p className="text-[#1e293b] dark:text-white text-sm font-semibold mb-0.5">
                    {i + 1}. {step.title}
                  </p>
                  <p className="text-[#64748b] dark:text-[#9ca3af] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4f46e5] dark:text-[#a78bfa] mb-4">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-xl p-4">
                <p className="text-[#1e293b] dark:text-white text-sm font-semibold mb-1.5">{faq.q}</p>
                <p className="text-[#64748b] dark:text-[#9ca3af] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4f46e5] dark:text-[#a78bfa] mb-4">Still need help?</h2>
          <div className="bg-white dark:bg-[#161616] border border-[#e2e8f0] dark:border-[#2a2a2a] rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[#64748b] dark:text-[#9ca3af] text-sm">If the FAQ didn't answer your question, reach out to us directly.</p>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:support@voicereport.app"
                className="flex items-center gap-3 text-sm text-[#4f46e5] dark:text-[#a78bfa] hover:underline"
              >
                <span className="text-base">✉️</span>
                support@voicereport.app
              </a>
              <div className="flex items-center gap-3 text-sm text-[#64748b] dark:text-[#9ca3af]">
                <span className="text-base">⏱️</span>
                We typically respond within 1 business day.
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
