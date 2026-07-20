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

export const SUBMIT_PROTOTYPE_CATEGORY_LABEL: Record<
  SubmitPrototypeCategory,
  string
> = {
  music: "音楽・音声",
  dev_tool: "開発ツール",
  web_service: "サービス・アプリ",
};

/** Local-only fields for prototype category panels — never written to DB. */
export type SubmitPrototypeCategoryFields = {
  musicKind: string;
  musicStatus: string;
  musicDuration: string;
  musicUse: string;
  toolHelps: string;
  toolEnv: string;
  toolInstall: string;
  serviceProblem: string;
  serviceDevices: string[];
  serviceSignup: string;
  serviceFree: string;
  /** 「届いたフィードバックをどう活かしたいか」— 複数選択仮案 */
  feedbackUses: string[];
};

export function createEmptySubmitPrototypeCategoryFields(): SubmitPrototypeCategoryFields {
  return {
    musicKind: "",
    musicStatus: "",
    musicDuration: "",
    musicUse: "",
    toolHelps: "",
    toolEnv: "",
    toolInstall: "",
    serviceProblem: "",
    serviceDevices: [],
    serviceSignup: "",
    serviceFree: "",
    feedbackUses: [],
  };
}

export function summarizeSubmitPrototypeCategoryFields(
  category: SubmitPrototypeCategory,
  fields: SubmitPrototypeCategoryFields,
): string {
  if (category === "music") {
    const parts = [
      fields.musicKind,
      fields.musicStatus,
      fields.musicDuration,
      fields.musicUse,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : "未設定";
  }
  if (category === "dev_tool") {
    const parts = [fields.toolHelps, fields.toolEnv, fields.toolInstall].filter(
      Boolean,
    );
    return parts.length > 0 ? parts.join(" · ") : "未設定";
  }
  const parts = [
    fields.serviceProblem,
    fields.serviceDevices.join("・"),
    fields.serviceSignup,
    fields.serviceFree,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "未設定";
}

export const MUSIC_KIND_OPTIONS = [
  "楽曲",
  "BGM",
  "効果音",
  "ボイス",
  "音声作品",
] as const;

export const MUSIC_STATUS_OPTIONS = [
  "デモ",
  "ミックス調整中",
  "完成済み",
] as const;

export const TOOL_ENV_OPTIONS = [
  "Unity向け",
  "Web開発向け",
  "ブラウザで使用",
] as const;

export const TOOL_INSTALL_OPTIONS = [
  "プラグイン",
  "CLI",
  "ダウンロード",
  "ブラウザ",
] as const;

export const SERVICE_DEVICE_OPTIONS = ["Web", "スマートフォン", "PC"] as const;

export const SERVICE_SIGNUP_OPTIONS = [
  "登録不要",
  "登録任意",
  "登録必須",
] as const;

export const SERVICE_FREE_OPTIONS = [
  "無料体験",
  "一部機能無料",
  "全面無料",
] as const;

export const SUBMIT_PROTOTYPE_FEEDBACK_USES = [
  "現在の作品を改善したい",
  "次の更新に活かしたい",
  "別バージョンや追加内容に活かしたい",
  "次回作や今後の制作に活かしたい",
  "利用者の受け取り方を知りたい",
] as const;

export const SUBMIT_PROTOTYPE_IMAGE_COPY: Record<
  SubmitPrototypeCategory,
  { label: string; hint: string; helperEmpty: string }
> = {
  music: {
    label: "アートワーク・代表画像",
    hint: "一覧や詳細の代表表示に使います。必須かどうかはまだ決めていません。",
    helperEmpty: "あれば追加してください（任意）",
  },
  dev_tool: {
    label: "代表画像",
    hint: "ツールの画面やアイコンなど、一覧で伝わる画像を追加できます。",
    helperEmpty: "まずは代表画像を1枚追加できます",
  },
  web_service: {
    label: "代表画像",
    hint: "サービスの画面やアイコンなど、一覧で伝わる画像を追加できます。",
    helperEmpty: "まずは代表画像を1枚追加できます",
  },
};
