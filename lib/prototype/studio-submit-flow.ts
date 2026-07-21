import type { WorkCategoryId } from "@/lib/prototype/domain-expansion";

/** Non-game categories that reuse the formal submit shell in Preview. */
export type SubmitPrototypeCategory = Exclude<WorkCategoryId, "game">;

export type SubmitFlowCategoryOption = {
  id: WorkCategoryId;
  title: string;
  hint: string;
  /** Query value after pick (`/studio/submit?view=category-proto&category=`) */
  querySlug: string;
};

export const SUBMIT_FLOW_CATEGORIES: SubmitFlowCategoryOption[] = [
  {
    id: "game",
    title: "ゲーム・インタラクティブ作品",
    hint: "遊んでフィードバックをもらう作品",
    querySlug: "game",
  },
  {
    id: "music",
    title: "音楽・音声",
    hint: "聴いて反応をもらう楽曲・音声",
    querySlug: "audio",
  },
  {
    id: "dev_tool",
    title: "開発ツール",
    hint: "制作・開発の作業を助けるツール",
    querySlug: "dev-tool",
  },
  {
    id: "web_service",
    title: "Webサービス・アプリ",
    hint: "使ってみて反応をもらうサービス",
    querySlug: "service-app",
  },
];

export function parseSubmitPrototypeCategory(
  value: string | null | undefined,
): SubmitPrototypeCategory | null {
  if (value === "audio" || value === "music") return "music";
  if (value === "dev-tool" || value === "dev_tool") return "dev_tool";
  if (value === "service-app" || value === "web_service") return "web_service";
  return null;
}

export function submitPrototypeHref(category: SubmitPrototypeCategory): string {
  const option = SUBMIT_FLOW_CATEGORIES.find((item) => item.id === category);
  return `/studio/submit?view=category-proto&category=${option?.querySlug ?? category}`;
}

export const SUBMIT_CATEGORY_PICK_HREF = "/studio/submit?view=category-proto";

export const SUBMIT_PROTOTYPE_CATEGORY_LABEL: Record<
  SubmitPrototypeCategory,
  string
> = {
  music: "音楽・音声",
  dev_tool: "開発ツール",
  web_service: "Webサービス・アプリ",
};

export const SUBMIT_PROTOTYPE_PRIMARY_CTA: Record<
  SubmitPrototypeCategory,
  string
> = {
  music: "聴く",
  dev_tool: "利用する",
  web_service: "利用する",
};

export const SUBMIT_PROTOTYPE_FEEDBACK_ASK_LABEL: Record<
  SubmitPrototypeCategory,
  string
> = {
  music: "聴いた人に聞きたいこと",
  dev_tool: "利用した人に聞きたいこと",
  web_service: "利用した人に聞きたいこと",
};

export const SUBMIT_PROTOTYPE_CLASSIFICATION_ROW_LABEL: Record<
  SubmitPrototypeCategory,
  string
> = {
  music: "ジャンル・タグを編集",
  dev_tool: "種類・タグを編集",
  web_service: "種類・タグを編集",
};

export const SUBMIT_PROTOTYPE_USAGE_ROW_LABEL: Record<
  SubmitPrototypeCategory,
  string
> = {
  music: "音源情報を編集",
  dev_tool: "利用情報を編集",
  web_service: "利用情報を編集",
};

export const SUBMIT_PROTOTYPE_USAGE_PANEL_TITLE: Record<
  SubmitPrototypeCategory,
  string
> = {
  music: "音源情報",
  dev_tool: "利用情報",
  web_service: "利用情報",
};

/** Prototype-only publish destinations — never written to formal kinds / DB. */
export type PrototypePublishDestination = {
  id: string;
  kind: string;
  url: string;
  isPrimary: boolean;
};

/** Local-only fields for prototype category panels — never written to DB. */
export type SubmitPrototypeCategoryFields = {
  kind: string;
  /** Music-only genre chips (not game FORGE_GENRE_OPTIONS). */
  musicGenres: string[];
  musicDuration: string;
  toolEnvironments: string[];
  toolUsageMethod: string;
  serviceEnvironments: string[];
  publishDestinations: PrototypePublishDestination[];
};

export function createEmptyPrototypePublishDestination(
  patch?: Partial<PrototypePublishDestination>,
): PrototypePublishDestination {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `proto-pub-${Date.now()}`,
    kind: "",
    url: "",
    isPrimary: false,
    ...patch,
  };
}

export function createEmptySubmitPrototypeCategoryFields(): SubmitPrototypeCategoryFields {
  return {
    kind: "",
    musicGenres: [],
    musicDuration: "",
    toolEnvironments: [],
    toolUsageMethod: "",
    serviceEnvironments: [],
    publishDestinations: [
      createEmptyPrototypePublishDestination({ isPrimary: true }),
    ],
  };
}

export function summarizeSubmitPrototypeClassification(
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
  featureTagCount: number,
): string {
  const parts: string[] = [];
  if (fields.kind) parts.push(fields.kind);
  if (category === "music" && fields.musicGenres.length > 0) {
    parts.push(fields.musicGenres.join("・"));
  }
  if (featureTagCount > 0) parts.push(`タグ${featureTagCount}`);
  return parts.length > 0 ? parts.join(" · ") : "未設定";
}

export function summarizeSubmitPrototypeUsage(
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
): string {
  if (category === "music") {
    return fields.musicDuration.trim() || "未設定";
  }
  if (category === "dev_tool") {
    const parts = [
      fields.toolEnvironments.join("・"),
      fields.toolUsageMethod,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : "未設定";
  }
  return fields.serviceEnvironments.length > 0
    ? fields.serviceEnvironments.join("・")
    : "未設定";
}

export function summarizeSubmitPrototypePublication(
  fields: SubmitPrototypeCategoryFields,
  visibilityLabel: string,
): string {
  const withUrl = fields.publishDestinations.filter((item) => item.url.trim());
  if (withUrl.length === 0) {
    return `公開先未設定 · ${visibilityLabel}`;
  }
  const primary =
    withUrl.find((item) => item.isPrimary) ?? withUrl[0];
  return `${primary.kind || "公開先"} · ${visibilityLabel}`;
}

export const MUSIC_KIND_OPTIONS = [
  "楽曲",
  "BGM",
  "効果音・ジングル",
  "ボイス",
  "朗読・音声ドラマ",
  "その他",
] as const;

export const MUSIC_GENRE_OPTIONS = [
  "ポップ",
  "ロック",
  "エレクトロニック",
  "ヒップホップ",
  "ジャズ",
  "クラシック",
  "アンビエント",
  "劇伴・シネマティック",
  "チップチューン",
  "和風",
  "その他",
] as const;

export const TOOL_KIND_OPTIONS = [
  "ブラウザツール",
  "デスクトップツール",
  "プラグイン・拡張機能",
  "CLI",
  "ライブラリ・SDK",
  "API",
  "デバッグ・テスト支援",
  "生成・変換ツール",
  "その他",
] as const;

export const SERVICE_KIND_OPTIONS = [
  "Webサービス",
  "スマートフォンアプリ",
  "デスクトップアプリ",
  "ブラウザ拡張",
  "Bot",
  "その他",
] as const;

export const TOOL_ENVIRONMENT_OPTIONS = [
  "Webブラウザ",
  "Windows",
  "macOS",
  "Linux",
  "Unity",
  "Unreal Engine",
  "Godot",
  "Visual Studio Code",
  "その他",
] as const;

export const TOOL_USAGE_METHOD_OPTIONS = [
  "ブラウザで利用",
  "ダウンロードして利用",
  "プラグイン・拡張機能として利用",
  "CLIで利用",
  "ライブラリ・SDKとして利用",
  "APIとして利用",
  "その他",
] as const;

export const SERVICE_ENVIRONMENT_OPTIONS = [
  "Webブラウザ",
  "iOS",
  "Android",
  "Windows",
  "macOS",
  "その他",
] as const;

export const SUBMIT_PROTOTYPE_IMAGE_COPY: Record<
  SubmitPrototypeCategory,
  { label: string; hint: string; helperEmpty: string }
> = {
  music: {
    label: "画像",
    hint: "ジャケットや作品を表す画像があれば追加してください。画像がなくても投稿できます。",
    helperEmpty: "画像なしでも投稿できます（任意）",
  },
  dev_tool: {
    label: "画像",
    hint: "操作画面や利用結果が分かる画像があると伝わりやすくなります。",
    helperEmpty: "まずは代表画像を1枚追加できます",
  },
  web_service: {
    label: "画像",
    hint: "サービス・アプリの画面や主要機能が分かる画像があると伝わりやすくなります。",
    helperEmpty: "まずは代表画像を1枚追加できます",
  },
};

/** Prototype-only destination kinds (labels). Formal PUBLISH_DESTINATION_KINDS untouched. */
export const SUBMIT_PROTOTYPE_PUBLISH_KINDS: Record<
  SubmitPrototypeCategory,
  readonly string[]
> = {
  music: [
    "YouTube",
    "SoundCloud",
    "Bandcamp",
    "BOOTH",
    "Spotify",
    "Apple Music",
    "Google Drive",
    "自サイト",
    "その他",
  ],
  dev_tool: [
    "ブラウザ版",
    "GitHub Releases",
    "GitHubリポジトリ",
    "BOOTH",
    "npm",
    "PyPI",
    "Unity Asset Store",
    "拡張機能ストア",
    "自サイト",
    "その他",
  ],
  web_service: [
    "Webサービス",
    "App Store",
    "Google Play",
    "ブラウザ拡張機能ストア",
    "Discord等の追加・招待先",
    "自サイト",
    "その他",
  ],
};

export function prototypePublishOpenLabel(kindLabel: string): string {
  const trimmed = kindLabel.trim();
  if (!trimmed || trimmed === "その他" || trimmed === "自サイト") {
    return "外部サイトで開く";
  }
  return `${trimmed}で開く`;
}

export function kindOptionsForCategory(
  category: SubmitPrototypeCategory,
): readonly string[] {
  if (category === "music") return MUSIC_KIND_OPTIONS;
  if (category === "dev_tool") return TOOL_KIND_OPTIONS;
  return SERVICE_KIND_OPTIONS;
}
