export const DEVELOPMENT_PHASE_OPTIONS = [
  {
    value: "プロトタイプ",
    hint: "最初の試遊版。操作感や面白さの第一印象を見たい",
  },
  {
    value: "開発中",
    hint: "遊べるが未完成。機能やコンテンツを足している段階",
  },
  {
    value: "テスト版",
    hint: "通しプレイ可能。バグ・バランス・分かりやすさを確認したい",
  },
  {
    value: "公開準備",
    hint: "ほぼ完成。最終調整と仕上げのフィードバック向け",
  },
] as const;

export type DevelopmentPhase =
  (typeof DEVELOPMENT_PHASE_OPTIONS)[number]["value"];
