const EMOJI_PRESETS = [
  "🐱", "🐶", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐙",
  "🦄", "🐲", "🌸", "🌙", "⭐", "🔥", "💎", "🎮", "🎲", "🎯",
  "🎨", "🎵", "📚", "🚀", "🌈", "☕", "🍜", "🍰", "⚔️", "🛡️",
  "🏹", "🧙", "🧝", "👾", "🤖", "👻", "🎃", "🦋", "🐉", "🌊",
  "🏔️", "🌲", "🍀", "💫", "✨", "🎭", "🎪", "🧩", "🔮", "🪐",
] as const;

const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#64748b",
  "#78716c", "#a16207", "#be123c", "#7c3aed", "#059669",
  "#0891b2", "#2563eb", "#c026d3", "#ea580c", "#65a30d",
  "#0d9488", "#0284c7", "#4f46e5", "#9333ea", "#db2777",
  "#dc2626", "#d97706", "#ca8a04", "#16a34a", "#059669",
  "#0e7490", "#1d4ed8", "#6d28d9", "#be185d", "#b45309",
  "#15803d", "#047857", "#0369a1", "#4338ca", "#7e22ce",
  "#a21caf", "#c2410c", "#a3e635", "#2dd4bf", "#38bdf8",
  "#818cf8",
] as const;

const LANDING_AVATARS = [
  "/images/landing/game-1.png",
  "/images/landing/game-2.png",
  "/images/landing/game-3.png",
  "/images/landing/game-4.png",
  "/images/landing/game-5.png",
];

function svgPresetAvatar(emoji: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${color}"/><text x="32" y="42" text-anchor="middle" font-size="28">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** プロフィール用アイコン候補（50件: ランディング5 + 絵文字45） */
export const profileAvatarPresets: { id: string; src: string; label: string }[] = [
  ...LANDING_AVATARS.map((src, index) => ({
    id: `landing-${index + 1}`,
    src,
    label: `Forge ${index + 1}`,
  })),
  ...EMOJI_PRESETS.slice(0, 45).map((emoji, index) => ({
    id: `preset-${index + 1}`,
    src: svgPresetAvatar(emoji, COLORS[index % COLORS.length]),
    label: emoji,
  })),
];

export function isDataOrBlobAvatar(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("blob:");
}
