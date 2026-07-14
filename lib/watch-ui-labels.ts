/** Player-facing labels for project watch (更新追跡) — distinct from 見届け人 grants. */

export const WATCH_BUTTON_OFF = "更新を追う";
export const WATCH_BUTTON_ON = "更新を追跡中";

/** マイページ tab（短め） */
export const WATCH_TAB_LABEL = "更新追跡中";

/** 一覧見出し */
export const WATCH_LIST_TITLE = "更新追跡中";

/** カードバッジ */
export const WATCH_BADGE_LABEL = "更新追跡中";

/** プロフィール統計など */
export const WATCH_STAT_LABEL = "更新追跡中";

/** 発見カード（/home・/search・開発者プロフィール）— project_watches 件数 */
export const DISCOVERY_CARD_WATCH_STAT_LABEL = "フォロー";

/** 発見カード — 登録ユーザーのフィードバック人数 */
export const DISCOVERY_CARD_FEEDBACK_STAT_LABEL = "フィードバック";

/**
 * 発見カード — project_plays の COUNT(DISTINCT user_id)。
 * 登録プレイヤーのみ（ゲスト行はテーブルに無い）。UI「プレイヤー N人」。
 */
export const DISCOVERY_CARD_PLAY_STAT_LABEL = "プレイヤー";

export const WATCH_FIRST_HINT =
  "更新を追い始めました。開発ログや新版の通知が届きます。「見届け人」は作品が正式版になったとき、プレイやフィードバックなどの関与で付与される称号で、このボタン1回では付与されません。";

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
