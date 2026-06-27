/** Player-facing labels for project watch (更新追跡) — distinct from 見届け人 grants. */

export const WATCH_BUTTON_OFF = "更新を追う";
export const WATCH_BUTTON_ON = "更新を追跡中";

/** マイページ tab（短め） */
export const WATCH_TAB_LABEL = "更新追跡中";

/** 一覧見出し */
export const WATCH_LIST_TITLE = "更新を追っている作品";

/** カードバッジ */
export const WATCH_BADGE_LABEL = "更新追跡中";

/** プロフィール統計など */
export const WATCH_STAT_LABEL = "更新追跡中";

export const WATCH_FIRST_HINT =
  "更新を追い始めました。開発ログや新版の通知が届きます。「見届け人」は作品が正式版になったとき、プレイや初声などの関与で付与される称号で、このボタン1回では付与されません。";

export const WATCH_FIRST_HINT_STORAGE_KEY = "forge-watch-first-hint-seen";

export function markWatchFirstHintSeen(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(WATCH_FIRST_HINT_STORAGE_KEY, "1");
}

export function hasSeenWatchFirstHint(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return localStorage.getItem(WATCH_FIRST_HINT_STORAGE_KEY) === "1";
}
