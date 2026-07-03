/** User-facing copy; internal data may still use legacy strings. */
import { getPublicGameTags } from "@/lib/play-environment";

export const LABEL_TEST_PLAY_OPEN = "テストプレイ受付中";
export const LABEL_TEST_PLAY_JOIN = "テストプレイに参加";

/** Legacy DB/mock status when `looking_for_testers` is true — never show raw to users. */
export const LEGACY_RECRUITING_STATUS = "テスター募集中";

export function displayGameStatus(status: string): string {
  return status === LEGACY_RECRUITING_STATUS ? LABEL_TEST_PLAY_OPEN : status;
}

export function displayGameTag(tag: string): string {
  return tag === LEGACY_RECRUITING_STATUS ? LABEL_TEST_PLAY_OPEN : tag;
}

/** Public feature tags with legacy recruitment labels mapped for display. */
export function getUserFacingGameTags(tags?: string[]): string[] {
  return getPublicGameTags(tags).map(displayGameTag);
}
