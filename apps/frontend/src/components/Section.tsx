interface SectionProps {
  title: string;
  color: "green" | "blue" | "red";
  items: string[];
  emptyMessage?: string;
}

const COLORS = {
  green: {
    wrapper: "bg-[#f0fdf4] dark:bg-[#0a1a0a] border border-[#bbf7d0] dark:border-[#16a34a]/25 rounded-xl overflow-hidden",
    header: "border-b border-[#bbf7d0] dark:border-[#16a34a]/25",
    dot: "bg-[#15803d] dark:bg-[#4ade80] dark:shadow-[0_0_6px_rgba(74,222,128,0.5)]",
    label: "text-[#15803d] dark:text-[#4ade80]",
    badge: "bg-[#dcfce7] dark:bg-[#16a34a]/20 border border-[#bbf7d0] dark:border-[#16a34a]/40 text-[#15803d] dark:text-[#4ade80]",
    iconBox: "bg-[#16a34a]/20",
    iconText: "text-[#15803d] dark:text-[#4ade80]",
    itemText: "text-[#166534] dark:text-[#86efac]",
    icon: "✓",
  },
  blue: {
    wrapper: "bg-[#eff6ff] dark:bg-[#080f1f] border border-[#bfdbfe] dark:border-[#3b82f6]/25 rounded-xl overflow-hidden",
    header: "border-b border-[#bfdbfe] dark:border-[#3b82f6]/25",
    dot: "bg-[#1d4ed8] dark:bg-[#60a5fa] dark:shadow-[0_0_6px_rgba(96,165,250,0.5)]",
    label: "text-[#1d4ed8] dark:text-[#60a5fa]",
    badge: "bg-[#dbeafe] dark:bg-[#3b82f6]/20 border border-[#bfdbfe] dark:border-[#3b82f6]/40 text-[#1d4ed8] dark:text-[#60a5fa]",
    iconBox: "bg-[#3b82f6]/20",
    iconText: "text-[#1d4ed8] dark:text-[#60a5fa]",
    itemText: "text-[#1e40af] dark:text-[#93c5fd]",
    icon: "◷",
  },
  red: {
    wrapper: "bg-[#fef2f2] dark:bg-[#160808] border border-[#fecaca] dark:border-[#ef4444]/30 rounded-xl overflow-hidden",
    header: "border-b border-[#fecaca] dark:border-[#ef4444]/30",
    dot: "bg-[#dc2626] dark:bg-[#f87171] dark:shadow-[0_0_6px_rgba(248,113,113,0.5)]",
    label: "text-[#dc2626] dark:text-[#f87171]",
    badge: "bg-[#fee2e2] dark:bg-[#ef4444]/20 border border-[#fecaca] dark:border-[#ef4444]/40 text-[#dc2626] dark:text-[#f87171]",
    iconBox: "bg-[#ef4444]/20",
    iconText: "text-[#dc2626] dark:text-[#f87171]",
    itemText: "text-[#b91c1c] dark:text-[#fca5a5]",
    icon: "!",
  },
};

export default function Section({ title, color, items, emptyMessage }: SectionProps) {
  const c = COLORS[color];
  return (
    <div className={c.wrapper}>
      <div className={`px-4 py-3 flex items-center justify-between ${c.header}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${c.dot}`} />
          <span className={`${c.label} text-xs font-bold uppercase tracking-wide`}>{title}</span>
        </div>
        <span className={`${c.badge} rounded-full px-2 py-0.5 text-xs font-semibold`}>
          {items.length}
        </span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-[#94a3b8] dark:text-[#4b5563] text-sm">{emptyMessage ?? "None"}</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 ${c.iconBox} flex items-center justify-center text-[9px] font-bold ${c.iconText}`}>
                {c.icon}
              </div>
              <span className={`${c.itemText} text-sm leading-relaxed`}>{item}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
