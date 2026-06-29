import {
  buildGameDetailTabHref,
  type GameDetailTab,
} from "@/lib/game-detail-tabs";

/** 実作品リンク — 必ず Supabase project UUID / mock catalog slug（id）を渡す */
export function gameDetailHrefWithTab(
  projectId: string,
  tab: GameDetailTab,
): string {
  return buildGameDetailTabHref(projectId, tab);
}

/** マイページの「更新内容を見る」→ 作品詳細の開発ログタブ */
export function gameUpdateDevlogHref(projectId: string): string {
  return gameDetailHrefWithTab(projectId, "devlog");
}

/** マイページの「今すぐ遊ぶ」→ 作品詳細（プレイ CTA） */
export function gamePlayEntryHref(projectId: string): string {
  return `/games/${encodeURIComponent(projectId)}`;
}

export function creatorProfileHref(creatorId: string): string {
  return `/creators/${encodeURIComponent(creatorId)}`;
}
