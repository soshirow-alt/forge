/** User-facing copy; internal data may still use legacy strings. */
export const LABEL_TEST_PLAY_OPEN = "テストプレイ受付中";
export const LABEL_TEST_PLAY_JOIN = "テストプレイに参加";

export function displayGameStatus(status: string): string {
  return status === "テスター募集中" ? LABEL_TEST_PLAY_OPEN : status;
}

export function displayGameTag(tag: string): string {
  return tag === "テスター募集中" ? LABEL_TEST_PLAY_OPEN : tag;
}
