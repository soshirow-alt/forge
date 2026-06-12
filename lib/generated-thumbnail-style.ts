export type PosterPalette = {
  from: string;
  via: string;
  to: string;
  accent: string;
  glow: string;
};

export type PosterPattern = "grid" | "diagonal" | "rings" | "beams";

const palettes: PosterPalette[] = [
  {
    from: "#c2410c",
    via: "#6d28d9",
    to: "#09090b",
    accent: "#fb923c",
    glow: "rgba(251, 146, 60, 0.35)",
  },
  {
    from: "#0369a1",
    via: "#4338ca",
    to: "#0f172a",
    accent: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.3)",
  },
  {
    from: "#b45309",
    via: "#be123c",
    to: "#18181b",
    accent: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.28)",
  },
  {
    from: "#047857",
    via: "#0891b2",
    to: "#022c22",
    accent: "#34d399",
    glow: "rgba(52, 211, 153, 0.28)",
  },
  {
    from: "#7c3aed",
    via: "#db2777",
    to: "#1e1b4b",
    accent: "#c4b5fd",
    glow: "rgba(196, 181, 253, 0.3)",
  },
  {
    from: "#dc2626",
    via: "#ea580c",
    to: "#1c1917",
    accent: "#fca5a5",
    glow: "rgba(252, 165, 165, 0.25)",
  },
];

const patterns: PosterPattern[] = ["grid", "diagonal", "rings", "beams"];

export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPosterStyle(seed: string) {
  const hash = hashString(seed);
  const palette = palettes[hash % palettes.length];
  const pattern = patterns[(hash >> 3) % patterns.length];
  const rotation = (hash % 24) - 12;

  return { palette, pattern, rotation, hash };
}
