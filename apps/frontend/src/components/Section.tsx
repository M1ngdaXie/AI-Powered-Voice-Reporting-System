export default function Section({
  title,
  color,
  items,
  empty,
}: {
  title: string;
  color: "green" | "blue" | "red";
  items: string[];
  empty: string;
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

  return (
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <h2 className={`font-semibold text-sm uppercase tracking-wider mb-3 ${titleColors[color]}`}>
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-gray-600 text-sm italic">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-gray-200 text-sm flex gap-2">
              <span className="text-gray-600 mt-0.5">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
