import type { WorkCategoryId } from "@/lib/prototype/domain-expansion";

export type SubmitFlowStep = "category" | "basics" | "details" | "feedback";

export const SUBMIT_FLOW_STEPS: {
  id: SubmitFlowStep;
  label: string;
}[] = [
  { id: "category", label: "カテゴリ" },
  { id: "basics", label: "基本情報" },
  { id: "details", label: "作品情報" },
  { id: "feedback", label: "フィードバック" },
];

export type SubmitFlowCategoryOption = {
  id: WorkCategoryId;
  title: string;
  hint: string;
};

export const SUBMIT_FLOW_CATEGORIES: SubmitFlowCategoryOption[] = [
  {
    id: "game",
    title: "ゲーム・インタラクティブ作品",
    hint: "遊んでフィードバックをもらう作品",
  },
  {
    id: "music",
    title: "音楽・音声",
    hint: "聴いて反応をもらう楽曲・音声",
  },
  {
    id: "dev_tool",
    title: "開発ツール",
    hint: "制作・開発の作業を助けるツール",
  },
  {
    id: "web_service",
    title: "Webサービス・アプリ",
    hint: "使ってみて反応をもらうサービス",
  },
];

/** Provisional: multi-select. Owner may later choose single. */
export const SUBMIT_FLOW_FEEDBACK_USES = [
  "現在の作品を改善したい",
  "次の更新に活かしたい",
  "別バージョンや追加内容に活かしたい",
  "次回作や今後の制作に活かしたい",
  "利用者の受け取り方を知りたい",
] as const;

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

export type SubmitFlowDraft = {
  title: string;
  lead: string;
  introduction: string;
  thumbnailUrls: string[];
  /** music */
  musicKind: string;
  musicStatus: string;
  musicDuration: string;
  musicUse: string;
  /** tool */
  toolHelps: string;
  toolEnv: string;
  toolInstall: string;
  /** service */
  serviceProblem: string;
  serviceDevices: string[];
  serviceSignup: string;
  serviceFree: string;
  /** feedback */
  authorFocus: string;
  feedbackUses: string[];
};

export function createEmptySubmitFlowDraft(): SubmitFlowDraft {
  return {
    title: "",
    lead: "",
    introduction: "",
    thumbnailUrls: [],
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
    authorFocus: "",
    feedbackUses: [],
  };
}
