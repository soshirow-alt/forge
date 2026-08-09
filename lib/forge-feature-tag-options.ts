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
  "コメディ",
  "ホラー・不穏",
  "周回・リプレイ性",
] as const;

export type ForgeFeatureTagOption = (typeof FORGE_FEATURE_TAG_OPTIONS)[number];

export const MAX_PROJECT_FEATURE_TAGS = 5;

const FEATURE_TAG_SET = new Set<string>(FORGE_FEATURE_TAG_OPTIONS);

export function pickFeatureTagsFromGameTags(tags: string[]): ForgeFeatureTagOption[] {
  return tags.filter((tag): tag is ForgeFeatureTagOption => FEATURE_TAG_SET.has(tag));
}

export function sanitizeFeatureTagsForSave(tags: string[]): ForgeFeatureTagOption[] {
  const unique: ForgeFeatureTagOption[] = [];
  for (const tag of tags) {
    if (!FEATURE_TAG_SET.has(tag) || unique.includes(tag as ForgeFeatureTagOption)) {
      continue;
    }
    unique.push(tag as ForgeFeatureTagOption);
    if (unique.length >= MAX_PROJECT_FEATURE_TAGS) {
      break;
    }
  }
  return unique;
}

export function toggleForgeFeatureTag(
  current: ForgeFeatureTagOption[],
  tag: ForgeFeatureTagOption,
): ForgeFeatureTagOption[] {
  if (current.includes(tag)) {
    return current.filter((item) => item !== tag);
  }
  if (current.length >= MAX_PROJECT_FEATURE_TAGS) {
    return current;
  }
  return [...current, tag];
}
