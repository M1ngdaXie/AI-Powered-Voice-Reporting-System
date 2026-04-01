const AVATAR_COLORS = [
  "#7c3aed", "#0d9488", "#d97706", "#2563eb",
  "#dc2626", "#059669", "#7c3aed", "#db2777",
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
