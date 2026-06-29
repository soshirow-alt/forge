/** 作品の特徴カード — 見出しの選択肢（概要タブ用） */
export const OVERVIEW_FEATURE_PRESET_OPTIONS = [
  "探索",
  "戦闘",
  "パズル",
  "ストーリー",
  "協力プレイ",
  "育成",
  "ホラー",
  "その他",
] as const;

export type OverviewFeaturePreset = (typeof OVERVIEW_FEATURE_PRESET_OPTIONS)[number];

export const OVERVIEW_FEATURE_OTHER: OverviewFeaturePreset = "その他";

export const OVERVIEW_FEATURE_CUSTOM_TITLE_MAX = 20;
export const OVERVIEW_FEATURE_DESCRIPTION_MAX = 120;

export function isOverviewFeaturePreset(value: string): value is OverviewFeaturePreset {
  return (OVERVIEW_FEATURE_PRESET_OPTIONS as readonly string[]).includes(value);
}

export function splitFeatureTitleForEdit(title: string): {
  preset: OverviewFeaturePreset | "";
  customTitle: string;
} {
  const trimmed = title.trim();
  if (!trimmed) {
    return { preset: "", customTitle: "" };
  }
  if (isOverviewFeaturePreset(trimmed) && trimmed !== OVERVIEW_FEATURE_OTHER) {
    return { preset: trimmed, customTitle: "" };
  }
  return { preset: OVERVIEW_FEATURE_OTHER, customTitle: trimmed };
}

export function resolveFeatureTitleForSave(
  preset: OverviewFeaturePreset | "",
  customTitle: string,
): string {
  if (!preset) {
    return "";
  }
  if (preset === OVERVIEW_FEATURE_OTHER) {
    return customTitle.trim();
  }
  return preset;
}
