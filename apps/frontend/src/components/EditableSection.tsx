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
  const colors = {
    green: "border-green-800 bg-green-950/40",
    blue: "border-blue-800 bg-blue-950/40",
    red: "border-red-800 bg-red-950/40",
  };
  const titleColors = {
    green: "text-green-400",
    blue: "text-blue-400",
    red: "text-red-400",
  };

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
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <h2 className={`font-semibold text-sm uppercase tracking-wider mb-3 ${titleColors[color]}`}>
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-gray-600 mt-0.5">→</span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <button
              onClick={() => removeItem(i)}
              className="text-gray-600 hover:text-red-400 text-sm transition-colors px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className={`mt-3 text-xs ${titleColors[color]} opacity-70 hover:opacity-100 transition-opacity`}
      >
        + Add item
      </button>
    </div>
  );
}
