export function getPlayTypeLabel(playUrl: string): string {
  const lower = playUrl.toLowerCase();

  if (lower.includes("steam")) {
    return "Steam";
  }

  if (lower.includes("itch.io")) {
    return "外部サイト";
  }

  if (
    lower.includes("github.io") ||
    lower.includes("vercel.app") ||
    lower.includes("netlify.app") ||
    lower.endsWith(".html")
  ) {
    return "ブラウザでプレイ";
  }

  if (lower.includes(".zip") || lower.includes("drive.google.com")) {
    return "ダウンロード";
  }

  return "外部サイト";
}

export type ExternalLink = {
  label: string;
  url: string;
};

/** Display order: Steam → itch → Discord → X → 公式 → YouTube → GitHub */
export type ProjectExternalLinksInput = {
  steamUrl?: string;
  itchUrl?: string;
  discordUrl?: string;
  xUrl?: string;
  officialUrl?: string;
  youtubeUrl?: string;
  githubUrl?: string;
};

export const PROJECT_EXTERNAL_LINK_SPECS = [
  {
    field: "steamUrl",
    label: "Steam",
    placeholder: "https://store.steampowered.com/...",
  },
  {
    field: "itchUrl",
    label: "itch.io",
    placeholder: "https://example.itch.io/...",
  },
  {
    field: "discordUrl",
    label: "Discord",
    placeholder: "https://discord.gg/...",
  },
  {
    field: "xUrl",
    label: "X",
    placeholder: "https://x.com/...",
  },
  {
    field: "officialUrl",
    label: "公式サイト",
    placeholder: "https://example.com",
  },
  {
    field: "youtubeUrl",
    label: "YouTube",
    placeholder: "https://www.youtube.com/...",
  },
  {
    field: "githubUrl",
    label: "GitHub",
    placeholder: "https://github.com/...",
  },
] as const satisfies ReadonlyArray<{
  field: keyof ProjectExternalLinksInput;
  label: string;
  placeholder: string;
}>;

export type ExternalLinkFormKey =
  | "steam"
  | "itch"
  | "discord"
  | "x"
  | "official"
  | "youtube"
  | "github";

export const EXTERNAL_LINK_FORM_SPECS: {
  key: ExternalLinkFormKey;
  field: keyof ProjectExternalLinksInput;
  label: string;
  placeholder: string;
}[] = [
  { key: "steam", field: "steamUrl", label: "Steam", placeholder: "https://store.steampowered.com/..." },
  { key: "itch", field: "itchUrl", label: "itch.io", placeholder: "https://example.itch.io/..." },
  { key: "discord", field: "discordUrl", label: "Discord", placeholder: "https://discord.gg/..." },
  { key: "x", field: "xUrl", label: "X", placeholder: "https://x.com/..." },
  { key: "official", field: "officialUrl", label: "公式サイト", placeholder: "https://example.com" },
  { key: "youtube", field: "youtubeUrl", label: "YouTube", placeholder: "https://www.youtube.com/..." },
  { key: "github", field: "githubUrl", label: "GitHub", placeholder: "https://github.com/..." },
];

export type ExternalLinkGroupId = "distribution" | "community" | "development";

export const EXTERNAL_LINK_GROUPS: {
  id: ExternalLinkGroupId;
  title: string;
  description: string;
  keys: ExternalLinkFormKey[];
}[] = [
  {
    id: "distribution",
    title: "ストア・配布先",
    description: "Steam や itch.io など、作品本体のページ",
    keys: ["steam", "itch"],
  },
  {
    id: "community",
    title: "コミュニティ・広報",
    description: "Discord・SNS・動画・公式サイトなど、告知・交流向け",
    keys: ["discord", "x", "youtube", "official"],
  },
  {
    id: "development",
    title: "開発情報",
    description: "ソースコードや開発リポジトリ",
    keys: ["github"],
  },
];

export function getExternalLinkSpec(key: ExternalLinkFormKey) {
  return EXTERNAL_LINK_FORM_SPECS.find((spec) => spec.key === key)!;
}

export function externalLinkKeysWithValues(
  values: ProjectExternalLinksInput,
): ExternalLinkFormKey[] {
  return EXTERNAL_LINK_FORM_SPECS.filter((spec) =>
    Boolean(values[spec.field]?.trim()),
  ).map((spec) => spec.key);
}

export type ExternalLinkFormValues = Record<
  keyof ProjectExternalLinksInput,
  string
>;

export function emptyExternalLinkFormValues(): ExternalLinkFormValues {
  return {
    steamUrl: "",
    itchUrl: "",
    discordUrl: "",
    xUrl: "",
    officialUrl: "",
    youtubeUrl: "",
    githubUrl: "",
  };
}

function trimUrl(url: string | undefined): string | undefined {
  const trimmed = url?.trim();
  return trimmed || undefined;
}

export function normalizeExternalUrlForDb(url: string | undefined): string | null {
  return trimUrl(url) ?? null;
}

export function getExternalLinks(game: ProjectExternalLinksInput): ExternalLink[] {
  const links: ExternalLink[] = [];

  for (const spec of PROJECT_EXTERNAL_LINK_SPECS) {
    const url = trimUrl(game[spec.field]);
    if (url) {
      links.push({ label: spec.label, url });
    }
  }

  return links;
}
