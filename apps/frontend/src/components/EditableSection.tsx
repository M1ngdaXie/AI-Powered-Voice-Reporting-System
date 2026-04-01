const COLORS = {
  green: {
    wrapper: "bg-[#f0fdf4] dark:bg-[#0a1a0a] border border-[#bbf7d0] dark:border-[#16a34a]/25 rounded-xl overflow-hidden",
    header: "border-b border-[#bbf7d0] dark:border-[#16a34a]/25",
    dot: "bg-[#15803d] dark:bg-[#4ade80] dark:shadow-[0_0_6px_rgba(74,222,128,0.5)]",
    label: "text-[#15803d] dark:text-[#4ade80]",
    badge: "bg-[#dcfce7] dark:bg-[#16a34a]/20 border border-[#bbf7d0] dark:border-[#16a34a]/40 text-[#15803d] dark:text-[#4ade80]",
    iconBox: "bg-[#16a34a]/20",
    iconText: "text-[#15803d] dark:text-[#4ade80]",
    inputText: "text-[#166534] dark:text-[#86efac]",
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
    inputText: "text-[#1e40af] dark:text-[#93c5fd]",
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
    inputText: "text-[#b91c1c] dark:text-[#fca5a5]",
    icon: "!",
  },
};

export default function EditableSection({
  title,
  color,
  items,
  onChange,
}: {
  title: string;
  color: "green" | "blue" | "red";
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const c = COLORS[color];

  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

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
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded flex-shrink-0 ${c.iconBox} flex items-center justify-center text-[9px] font-bold ${c.iconText}`}>
              {c.icon}
            </div>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className={`flex-1 bg-transparent ${c.inputText} text-sm border-0 outline-none placeholder:text-[#94a3b8] dark:placeholder:text-[#6b7280]`}
              placeholder="Enter item..."
            />
            <button
              onClick={() => removeItem(i)}
              className="text-[#94a3b8] dark:text-[#6b7280] hover:text-[#dc2626] dark:hover:text-[#f87171] text-sm transition-colors ml-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="text-[#64748b] dark:text-[#6b7280] hover:text-[#1e293b] dark:hover:text-white text-xs border-t border-[#e2e8f0] dark:border-[#1f1f1f] w-full pt-2 mt-1 text-left transition-colors"
        >
          + Add item
        </button>
      </div>
    </div>
  );
}
