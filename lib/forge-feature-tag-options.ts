/**
 * 作品投稿フォームの特徴タグ（ジャンルではないプレイ特性・見た目など）
 */
export const FORGE_FEATURE_TAG_OPTIONS = [
  "ストーリー重視",
  "癒し系",
  "ストーリー",
  "インディー",
  "ピクセルアート",
  "レトロ",
  "協力プレイ",
  "ソロ向け",
  "短時間プレイ",
  "高難度",
  "PvP",
  "PvE",
] as const;

export type ForgeFeatureTagOption = (typeof FORGE_FEATURE_TAG_OPTIONS)[number];
