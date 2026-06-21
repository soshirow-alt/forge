import { gameDetailHrefFromTitle } from "@/lib/game-detail-v0-mock-data";

export function gameDetailHrefWithTab(
  title: string,
  tab: "overview" | "devlog" | "voices" | "versions",
): string {
  const base = gameDetailHrefFromTitle(title);
  return tab === "overview" ? base : `${base}?tab=${tab}`;
}

/** マイページの「更新内容を見る」→ ゲーム詳細の開発ログタブ */
export function gameUpdateDevlogHref(title: string): string {
  return gameDetailHrefWithTab(title, "devlog");
}

/** マイページの「今すぐ遊ぶ」→ ゲーム詳細（プレイ CTA） */
export function gamePlayEntryHref(title: string): string {
  return gameDetailHrefFromTitle(title);
}

export function creatorProfileHref(creatorId: string): string {
  return `/creators/${encodeURIComponent(creatorId)}`;
}
