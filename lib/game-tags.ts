export const AVAILABLE_TAGS = [
  "RPG",
  "アクション",
  "ホラー",
  "パズル",
  "ローグライク",
  "協力プレイ",
  "短時間",
  "テスター募集中",
] as const;

export type GameTag = (typeof AVAILABLE_TAGS)[number];

export function getGameTags(tags?: string[]): string[] {
  return tags ?? [];
}

export function mergeTagsWithRecruitment(
  tags: string[],
  lookingForTesters: boolean,
): string[] {
  if (!lookingForTesters) {
    return tags;
  }

  if (tags.includes("テスター募集中")) {
    return tags;
  }

  return [...tags, "テスター募集中"];
}
